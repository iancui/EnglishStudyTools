import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
import {
  User, Word, Sentence, Dictionary, DictionaryWord, StudySession, StudySessionWord,
  UserDictionaryConfig, UserWordProgress, UserSentenceProgress, SentencePracticeSession,
  SentencePracticeItem, LearningRecord, ReviewRecord
} from '../types/index.ts';
import { extractSentencePhrases } from '../utils/sentenceUtils.ts';

type Row = Record<string, any>;

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'linguastep',
  password: process.env.DB_PASSWORD || 'LinguaDB@123456',
  database: process.env.DB_NAME || 'linguastep',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

const iso = (v: any) => v ? new Date(v).toISOString() : undefined;
// MySQL 5.7 DATETIME does not accept ISO-8601 strings containing T/Z.
const mysqlDate = (v: any) => v ? new Date(v).toISOString().slice(0, 19).replace('T', ' ') : null;

class MySQLStorage {
  async findUserByEmail(email: string): Promise<User | undefined> {
    const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1', [email]);
    return this.user((rows as Row[])[0]);
  }
  async findUserByUsername(username: string): Promise<User | undefined> {
    const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(username)=LOWER(?) LIMIT 1', [username]);
    return this.user((rows as Row[])[0]);
  }
  async findUserById(id: string): Promise<User | undefined> {
    const [rows] = await pool.query('SELECT * FROM users WHERE id=? LIMIT 1', [id]);
    return this.user((rows as Row[])[0]);
  }
  async createUser(user: User): Promise<User> {
    const c: UserDictionaryConfig = { id:`cfg-${Date.now()}`, userId:user.id, defaultDictionaryId:'dict-primary-6', sentenceDictionaryId:'dict-primary-6', englishDict:'Oxford', ecDict:'Oxford', phoneticType:'UK', audioType:'UK', enablePhonics:true, sentencePracticeCount:5, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
    const d: Dictionary = { id:`dict-user-${user.id}`, name:`${user.username}的生词本`, code:`vocab_${user.username}_${Date.now().toString(36)}`, description:'个人专属生词与高频复习词汇集', ownerType:'USER', ownerUserId:user.id, isSystem:false, isPublic:false, status:'ACTIVE', createdAt:c.createdAt, updatedAt:c.updatedAt };
    const conn=await pool.getConnection(); try { await conn.beginTransaction();
      await conn.query('INSERT INTO users(id,username,email,password_hash,role,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',[user.id,user.username,user.email,user.passwordHash,user.role,mysqlDate(user.createdAt),mysqlDate(user.updatedAt)]);
      await conn.query('INSERT IGNORE INTO user_roles(user_id,role_id) VALUES(?,?)',[user.id,'USER']);
      await conn.query('INSERT INTO dictionary(id,name,code,description,owner_type,owner_user_id,is_system,is_public,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[d.id,d.name,d.code,d.description,d.ownerType,d.ownerUserId,d.isSystem,d.isPublic,d.status,mysqlDate(d.createdAt),mysqlDate(d.updatedAt)]);
      await conn.query('INSERT INTO user_dictionary_config(id,user_id,default_dictionary_id,sentence_dictionary_id,phonetic_type,audio_type,enable_phonics,sentence_practice_count,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',[c.id,c.userId,c.defaultDictionaryId,c.sentenceDictionaryId,c.phoneticType,c.audioType,c.enablePhonics,c.sentencePracticeCount,mysqlDate(c.createdAt),mysqlDate(c.updatedAt)]);
      await conn.commit(); return user;
    } catch(e){await conn.rollback();throw e} finally{conn.release()}
  }

  private user(r?:Row): User|undefined { if(!r)return; return {id:r.id,username:r.username,email:r.email,passwordHash:r.password_hash,role:r.role,createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!}; }

  async getUserRoles(userId:string): Promise<any[]> {
    const [rows] = await pool.query(
      'SELECT r.id, r.display_name AS displayName, r.description, r.is_system AS isSystem FROM roles r JOIN user_roles ur ON ur.role_id=r.id WHERE ur.user_id=? ORDER BY r.id',
      [userId]
    );
    return rows as Row[];
  }

  async getUserPermissionIds(userId:string): Promise<string[]> {
    const [rows] = await pool.query(
      'SELECT DISTINCT rp.permission_id FROM role_permissions rp JOIN user_roles ur ON ur.role_id=rp.role_id WHERE ur.user_id=? UNION SELECT p.id FROM permissions p JOIN roles r ON r.id=\'SUPER_ADMIN\' JOIN user_roles ur ON ur.role_id=r.id WHERE ur.user_id=?',
      [userId, userId]
    );
    return (rows as Row[]).map(r=>String(r.permission_id));
  }

  async getUserAccess(userId:string) {
    return { roles: await this.getUserRoles(userId), permissions: await this.getUserPermissionIds(userId) };
  }

  async hasPermission(userId:string, permissionId:string): Promise<boolean> {
    const [rows] = await pool.query(
      'SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id LEFT JOIN role_permissions rp ON rp.role_id=ur.role_id AND rp.permission_id=? WHERE ur.user_id=? AND (r.id=\'SUPER_ADMIN\' OR rp.permission_id=?) LIMIT 1',
      [permissionId, userId, permissionId]
    );
    return (rows as Row[]).length > 0;
  }

  async getAdminUsers(): Promise<any[]> {
    const [rows] = await pool.query('SELECT id,username,email,role,created_at AS createdAt,updated_at AS updatedAt FROM users ORDER BY created_at DESC');
    const users = rows as Row[];
    return Promise.all(users.map(async u => ({
      id:u.id, username:u.username, email:u.email, legacyRole:u.role,
      createdAt:iso(u.createdAt), updatedAt:iso(u.updatedAt),
      roles:await this.getUserRoles(u.id)
    })));
  }

  async getRoles(): Promise<any[]> {
    const [rows] = await pool.query('SELECT id,display_name AS displayName,description,is_system AS isSystem,created_at AS createdAt,updated_at AS updatedAt FROM roles ORDER BY is_system DESC,id');
    return rows as Row[];
  }

  async createRole(input:{id:string;displayName:string;description?:string}) {
    const id=String(input.id||'').trim();
    const displayName=String(input.displayName||'').trim();
    if(!/^[A-Z][A-Z0-9_]{2,50}$/.test(id)) throw new Error('角色标识只能使用大写字母、数字和下划线，长度3-51');
    if(!displayName) throw new Error('角色名称不能为空');
    await pool.query('INSERT INTO roles(id,display_name,description,is_system) VALUES(?,?,?,0)',[id,displayName,String(input.description||'').trim()||null]);
    return (await this.getRoles()).find(r=>r.id===id);
  }

  async updateRole(id:string,input:{displayName?:string;description?:string}) {
    const [check] = await pool.query('SELECT is_system FROM roles WHERE id=?',[id]);
    const row=(check as Row[])[0];
    if(!row) throw new Error('角色不存在');
    if(Boolean(row.is_system)) throw new Error('系统角色不可修改');
    await pool.query('UPDATE roles SET display_name=?,description=?,updated_at=NOW() WHERE id=?',[String(input.displayName||'').trim(),String(input.description||'').trim()||null,id]);
    return (await this.getRoles()).find(r=>r.id===id);
  }

  async deleteRole(id:string): Promise<boolean> {
    const [check] = await pool.query('SELECT is_system FROM roles WHERE id=?',[id]);
    const row=(check as Row[])[0];
    if(!row) return false;
    if(Boolean(row.is_system)) throw new Error('系统角色不可删除');
    const [users] = await pool.query('SELECT COUNT(*) n FROM user_roles WHERE role_id=?',[id]);
    if(Number((users as Row[])[0]?.n||0)>0) throw new Error('角色仍被用户使用，不能删除');
    const [result] = await pool.query('DELETE FROM roles WHERE id=?',[id]);
    return Number((result as any).affectedRows)>0;
  }

  async getPermissions(): Promise<any[]> {
    const [rows] = await pool.query('SELECT id,display_name AS displayName,resource,action,description FROM permissions ORDER BY resource,action,id');
    return rows as Row[];
  }

  async getRolePermissions(roleId:string): Promise<string[]> {
    // SUPER_ADMIN is a virtual full-access role: it does not need individual rows in role_permissions.
    if (roleId === 'SUPER_ADMIN') {
      const [rows] = await pool.query('SELECT id FROM permissions ORDER BY id');
      return (rows as Row[]).map(r=>String(r.id));
    }
    const [rows] = await pool.query('SELECT permission_id FROM role_permissions WHERE role_id=? ORDER BY permission_id',[roleId]);
    return (rows as Row[]).map(r=>String(r.permission_id));
  }

  async setRolePermissions(roleId:string,permissionIds:string[]) {
    const [check] = await pool.query('SELECT id,is_system FROM roles WHERE id=?',[roleId]);
    const role=(check as Row[])[0];
    if(!role) throw new Error('角色不存在');
    if(roleId==='SUPER_ADMIN') throw new Error('超级管理员权限不可修改');
    const ids=[...new Set(permissionIds.map(String).filter(Boolean))];
    const conn=await pool.getConnection();
    try { await conn.beginTransaction();
      await conn.query('DELETE FROM role_permissions WHERE role_id=?',[roleId]);
      if(ids.length) {
        const [valid] = await conn.query('SELECT id FROM permissions WHERE id IN ('+ids.map(()=>'?').join(',')+')',ids);
        for(const p of valid as Row[]) await conn.query('INSERT INTO role_permissions(role_id,permission_id) VALUES(?,?)',[roleId,p.id]);
      }
      await conn.commit();
      return this.getRolePermissions(roleId);
    } catch(e){await conn.rollback();throw e} finally{conn.release()}
  }

  async setUserRoles(userId:string,roleIds:string[]) {
    const [userRows] = await pool.query('SELECT id FROM users WHERE id=?',[userId]);
    if(!(userRows as Row[]).length) throw new Error('用户不存在');
    const ids=[...new Set(roleIds.map(String).filter(Boolean))];
    const [valid] = await pool.query('SELECT id FROM roles WHERE id IN ('+ids.map(()=>'?').join(',')+')',ids);
    if((valid as Row[]).length!==ids.length) throw new Error('包含不存在的角色');
    const current=await this.getUserRoles(userId);
    const hadSuper=current.some(r=>r.id==='SUPER_ADMIN');
    const keepsSuper=ids.includes('SUPER_ADMIN');
    if(hadSuper && !keepsSuper){
      const [countRows]=await pool.query('SELECT COUNT(*) n FROM user_roles WHERE role_id=\'SUPER_ADMIN\'');
      if(Number((countRows as Row[])[0]?.n||0)<=1) throw new Error('系统至少需要保留一个超级管理员');
    }
    const conn=await pool.getConnection();
    try { await conn.beginTransaction();
      await conn.query('DELETE FROM user_roles WHERE user_id=?',[userId]);
      for(const id of ids) await conn.query('INSERT INTO user_roles(user_id,role_id) VALUES(?,?)',[userId,id]);
      await conn.commit();
      return this.getUserRoles(userId);
    } catch(e){await conn.rollback();throw e} finally{conn.release()}
  }
  async getAllDictionaries(userId?: string) { const [rows]=await pool.query(`SELECT d.* FROM dictionary d WHERE d.status='ACTIVE' AND (d.is_system=1 OR d.is_public=1 OR d.owner_user_id=?) ORDER BY d.created_at`,[userId||'']); return (rows as Row[]).map(this.dict); }
  async getUserDictionaries(userId:string){const [rows]=await pool.query(`SELECT d.* FROM dictionary d WHERE d.owner_type='USER' AND d.owner_user_id=? AND d.status<>'INACTIVE' ORDER BY d.created_at`,[userId]);return(rows as Row[]).map(this.dict)}
  async getWordUserDictionaries(userId:string,wordId:string){const [rows]=await pool.query(`SELECT dw.dictionary_id FROM dictionary_word dw JOIN dictionary d ON d.id=dw.dictionary_id WHERE d.owner_type='USER' AND d.owner_user_id=? AND dw.word_id=? AND dw.is_active=1`,[userId,wordId]);return(rows as Row[]).map(r=>r.dictionary_id)}
  async getAdminDictionaries(){const [rows]=await pool.query(`SELECT * FROM dictionary ORDER BY created_at`);return(rows as Row[]).map(this.dict)}
  async findDictionaryById(id:string){const [rows]=await pool.execute(`SELECT * FROM dictionary WHERE id=? LIMIT 1`,[id]);return this.dict((rows as Row[])[0])}
  private dict(r?:Row):any{if(!r)return;return{id:r.id,name:r.name,code:r.code,description:r.description||'',ownerType:r.owner_type,ownerUserId:r.owner_user_id,isSystem:Boolean(r.is_system),isPublic:Boolean(r.is_public),status:r.status,wordCount:Number(r.word_count||0),createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!}}
  async createDictionary(d:Dictionary){await pool.query('INSERT INTO dictionary(id,name,code,description,owner_type,owner_user_id,is_system,is_public,status,word_count,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[d.id,d.name,d.code,d.description||'',d.ownerType,d.ownerUserId,d.isSystem,d.isPublic,d.status,Number(d.wordCount||0),mysqlDate(d.createdAt),mysqlDate(d.updatedAt)]);return d}
  async updateDictionary(id:string,p:Partial<Dictionary>){const d=await this.findDictionaryById(id);if(!d)return;const x={...d,...p,updatedAt:new Date().toISOString()};await pool.query('UPDATE dictionary SET name=?,description=?,is_public=?,status=?,updated_at=? WHERE id=?',[x.name,x.description||'',x.isPublic,x.status,mysqlDate(x.updatedAt),id]);return x}
  async deleteDictionary(id:string){const [r]=await pool.query('DELETE FROM dictionary WHERE id=?',[id]);return Number((r as any).affectedRows)>0}
  async getDictionaryWords(dictionaryId:string){const [rows]=await pool.query(`SELECT dw.id AS dw_id,dw.dictionary_id,dw.word_id,dw.sequence_no,dw.is_active,dw.definition_source,dw.created_at,w.id AS word_ref_id FROM dictionary_word dw JOIN word w ON w.id=dw.word_id WHERE dw.dictionary_id=? AND dw.is_active=1 ORDER BY dw.sequence_no`,[dictionaryId]);return Promise.all((rows as Row[]).map(async r=>({id:r.dw_id,dictionaryId:r.dictionary_id,wordId:r.word_id,sequence:r.sequence_no,isActive:Boolean(r.is_active),definitionSource:r.definition_source||undefined,createdAt:iso(r.created_at)!,word:await this.findWordById(r.word_id)})))}
  private dw(r:Row):DictionaryWord{return{id:r.id,dictionaryId:r.dictionary_id,wordId:r.word_id,sequence:r.sequence_no,isActive:Boolean(r.is_active),definitionSource:r.definition_source||undefined,createdAt:iso(r.created_at)!}}
  async addWordToDictionary(dictionaryId:string,wordId:string,sequence?:number){const [rows]=await pool.query('SELECT * FROM dictionary_word WHERE dictionary_id=? AND word_id=?',[dictionaryId,wordId]);let r=(rows as Row[])[0];if(r){await pool.query('UPDATE dictionary_word SET is_active=1 WHERE id=?',[r.id]);return this.dw({...r,is_active:1})}const [[m]]:any=await pool.query('SELECT COALESCE(MAX(sequence_no),0)+1 n FROM dictionary_word WHERE dictionary_id=?',[dictionaryId]);const x={id:`dw-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,dictionaryId,wordId,sequence:sequence??m.n,isActive:true,createdAt:new Date().toISOString()};await pool.query('INSERT INTO dictionary_word(id,dictionary_id,word_id,sequence_no,is_active,created_at) VALUES(?,?,?,?,?,?)',[x.id,dictionaryId,wordId,x.sequence,1,mysqlDate(x.createdAt)]);return x}
  async removeWordFromDictionary(dictionaryId:string,wordId:string){const [r]=await pool.query('DELETE FROM dictionary_word WHERE dictionary_id=? AND word_id=? AND is_active=1',[dictionaryId,wordId]);const changed=Number((r as any).affectedRows)>0;if(changed) await pool.query('UPDATE dictionary SET word_count=GREATEST(word_count-1,0) WHERE id=?',[dictionaryId]);return changed}
  async batchAddWordsToDictionary(id:string,wids:string[]){const out=[];for(const w of wids){if(await this.findWordById(w))out.push(await this.addWordToDictionary(id,w))}return out}
  async getSettingsBundle(userId: string) {
    const [configRows] = await pool.query('SELECT * FROM user_dictionary_config WHERE user_id=? LIMIT 1', [userId]);
    let configRow = (configRows as Row[])[0];
    if (!configRow) {
      const now = new Date().toISOString();
      const id = `cfg-${Date.now()}`;
      await pool.query(
        'INSERT INTO user_dictionary_config(id,user_id,default_dictionary_id,sentence_dictionary_id,phonetic_type,audio_type,enable_phonics,sentence_practice_count,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
        [id,userId,'dict-primary-6','dict-primary-6','UK','UK',1,5,mysqlDate(now),mysqlDate(now)]
      );
      configRow = { id,user_id:userId,default_dictionary_id:'dict-primary-6',sentence_dictionary_id:'dict-primary-6',phonetic_type:'UK',audio_type:'UK',enable_phonics:1,sentence_practice_count:5,created_at:now,updated_at:now };
    }

    const [dictRows] = await pool.query(
      `SELECT d.* FROM dictionary d
       WHERE d.status='ACTIVE' AND (d.is_system=1 OR d.is_public=1 OR d.owner_user_id=?)
       ORDER BY d.created_at`,
      [userId]
    );
    const rawDictionaries = dictRows as Row[];
    const dictionaries = rawDictionaries.map(this.dict);
    const myDictionaries = rawDictionaries
      .filter(r => r.owner_type === 'USER' && String(r.owner_user_id || '') === userId && r.status !== 'INACTIVE')
      .map(this.dict);

    return {
      config: this.config(configRow),
      dictionaries,
      myDictionaries
    };
  }

  async getDictionaryConfig(userId:string){let [rows]=await pool.query('SELECT * FROM user_dictionary_config WHERE user_id=?',[userId]);let r=(rows as Row[])[0];if(!r){const now=new Date().toISOString();const id=`cfg-${Date.now()}`;await pool.query('INSERT INTO user_dictionary_config(id,user_id,default_dictionary_id,sentence_dictionary_id,phonetic_type,audio_type,enable_phonics,sentence_practice_count,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',[id,userId,'dict-primary-6','dict-primary-6','UK','UK',1,5,mysqlDate(now),mysqlDate(now)]);r={id,user_id:userId,default_dictionary_id:'dict-primary-6',sentence_dictionary_id:'dict-primary-6',phonetic_type:'UK',audio_type:'UK',enable_phonics:1,sentence_practice_count:5,created_at:now,updated_at:now}}return this.config(r)}
  private config(r:Row):UserDictionaryConfig{return{id:r.id,userId:r.user_id,defaultDictionaryId:r.default_dictionary_id||undefined,sentenceDictionaryId:r.sentence_dictionary_id||undefined,phoneticType:r.phonetic_type,audioType:r.audio_type,enablePhonics:Boolean(r.enable_phonics),sentencePracticeCount:Number(r.sentence_practice_count||5),createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!}}
  async saveDictionaryConfig(userId:string,p:Partial<UserDictionaryConfig>){const c=await this.getDictionaryConfig(userId);const x={...c,...p,updatedAt:new Date().toISOString()};await pool.query('UPDATE user_dictionary_config SET default_dictionary_id=?,sentence_dictionary_id=?,phonetic_type=?,audio_type=?,enable_phonics=?,sentence_practice_count=?,updated_at=? WHERE user_id=?',[x.defaultDictionaryId||null,x.sentenceDictionaryId||null,x.phoneticType,x.audioType,x.enablePhonics,x.sentencePracticeCount||5,mysqlDate(x.updatedAt),userId]);return x}

  async getStudyCandidates(dictionaryId: string, userId: string, excludeMastered: boolean, sortMode: string, limit: number) {
    let order = 'dw.sequence_no ASC';
    if (sortMode === 'RANDOM') order = 'RAND()';
    else if (sortMode === 'REVIEW_FIRST') order = `CASE WHEN up.status='REVIEW' AND up.next_review_at IS NOT NULL AND up.next_review_at <= NOW() THEN 0 WHEN up.status='REVIEW' THEN 1 WHEN up.status='LEARNING' THEN 2 ELSE 3 END, dw.sequence_no ASC`;
    const mastered = excludeMastered ? "AND (up.word_id IS NULL OR (up.status <> 'MASTERED' AND COALESCE(up.mastery,0) <= 90))" : '';
    const [rows] = await pool.query(
      `SELECT dw.word_id, dw.sequence_no
       FROM dictionary_word dw
       LEFT JOIN user_word_progress up ON up.word_id=dw.word_id AND up.user_id=?
       WHERE dw.dictionary_id=? AND dw.is_active=1 ${mastered}
       ORDER BY ${order}
       LIMIT ?`,
      [userId, dictionaryId, Math.max(1, limit)]
    );
    return rows as Row[];
  }

  async getStudyCandidateCount(dictionaryId: string, userId: string, excludeMastered: boolean) {
    const mastered = excludeMastered ? "AND (up.word_id IS NULL OR (up.status <> 'MASTERED' AND COALESCE(up.mastery,0) <= 90))" : '';
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM dictionary_word dw
       LEFT JOIN user_word_progress up ON up.word_id=dw.word_id AND up.user_id=?
       WHERE dw.dictionary_id=? AND dw.is_active=1 ${mastered}`,
      [userId, dictionaryId]
    );
    return Number((rows as Row[])[0]?.total || 0);
  }

  async getWordsByIds(ids: string[]) {
    if (!ids.length) return [] as Word[];
    const unique = [...new Set(ids)];
    const result = new Map<string, Word>();
    for (let i = 0; i < unique.length; i += 500) {
      const part = unique.slice(i, i + 500);
      const placeholders = part.map(() => '?').join(',');
      const [rows] = await pool.query(`SELECT * FROM word WHERE id IN (${placeholders})`, part);
      const wordRows = rows as Row[];
      const wordIds = wordRows.map(r => String(r.id));
      const meanings = wordIds.length
        ? (await pool.query(`SELECT * FROM word_meaning WHERE word_id IN (${wordIds.map(() => '?').join(',')}) ORDER BY created_at`, wordIds))[0] as Row[]
        : [];
      const phonics = wordIds.length
        ? (await pool.query(`SELECT * FROM word_phonics WHERE word_id IN (${wordIds.map(() => '?').join(',')}) ORDER BY sequence_no`, wordIds))[0] as Row[]
        : [];
      const meaningsMap = new Map<string, Row[]>();
      const phonicsMap = new Map<string, Row[]>();
      for (const m of meanings) {
        const key = String(m.word_id);
        if (!meaningsMap.has(key)) meaningsMap.set(key, []);
        meaningsMap.get(key)!.push(m);
      }
      for (const p of phonics) {
        const key = String(p.word_id);
        if (!phonicsMap.has(key)) phonicsMap.set(key, []);
        phonicsMap.get(key)!.push(p);
      }
      for (const r of wordRows) {
        const ms = meaningsMap.get(String(r.id)) || [];
        const ps = phonicsMap.get(String(r.id)) || [];
        result.set(String(r.id), {
          id:r.id,text:r.text,phoneticUk:r.phonetic_uk||'',phoneticUs:r.phonetic_us||'',
          audioUkUrl:r.audio_uk_url||undefined,audioUsUrl:r.audio_us_url||undefined,pos:r.pos||'',
          difficulty:Number(r.difficulty||1),
          meanings:ms.map(x=>({id:x.id,wordId:x.word_id,pos:x.pos,definitionCn:x.definition_cn,definitionEn:x.definition_en||undefined,exampleEn:x.example_en||undefined,exampleCn:x.example_cn||undefined})),
          phonics:ps.map(x=>({id:x.id,wordId:x.word_id,sequence:x.sequence_no,text:x.text,phonetic:x.phonetic,syllable:x.syllable,audioUrl:x.audio_url||undefined}))
        } as Word);
      }
    }
    return unique.map(id => result.get(id)).filter(Boolean) as Word[];
  }

  async getAllWords(){const [rows]=await pool.query('SELECT * FROM word ORDER BY id');return Promise.all((rows as Row[]).map(r=>this.findWordById(r.id))) as any}
  async findWordById(id:string){const [rows]=await pool.execute('SELECT * FROM word WHERE id=?',[id]);return this.loadWord((rows as Row[])[0])}
  async findWordByText(text:string){const [rows]=await pool.query('SELECT * FROM word WHERE LOWER(text)=LOWER(?)',[text.trim()]);return this.loadWord((rows as Row[])[0])}
  private async loadWord(r?:Row):Promise<Word|undefined>{if(!r)return;const [m]=await pool.query('SELECT * FROM word_meaning WHERE word_id=? ORDER BY created_at',[r.id]);const [p]=await pool.query('SELECT * FROM word_phonics WHERE word_id=? ORDER BY sequence_no',[r.id]);return{id:r.id,text:r.text,phoneticUk:r.phonetic_uk||'',phoneticUs:r.phonetic_us||'',audioUkUrl:r.audio_uk_url||undefined,audioUsUrl:r.audio_us_url||undefined,pos:r.pos||'',difficulty:Number(r.difficulty||1),meanings:(m as Row[]).map(x=>({id:x.id,wordId:x.word_id,pos:x.pos,definitionCn:x.definition_cn,definitionEn:x.definition_en||undefined,exampleEn:x.example_en||undefined,exampleCn:x.example_cn||undefined})),phonics:(p as Row[]).map(x=>({id:x.id,wordId:x.word_id,sequence:x.sequence_no,text:x.text,phonetic:x.phonetic,syllable:x.syllable,audioUrl:x.audio_url||undefined}))}}
  async createWord(w:Word){const c=await pool.getConnection();try{await c.beginTransaction();await c.query('INSERT INTO word(id,text,phonetic_uk,phonetic_us,audio_uk_url,audio_us_url,pos,difficulty) VALUES(?,?,?,?,?,?,?,?)',[w.id,w.text,w.phoneticUk,w.phoneticUs,w.audioUkUrl||null,w.audioUsUrl||null,w.pos,w.difficulty]);for(const m of w.meanings)await c.query('INSERT INTO word_meaning(id,word_id,pos,definition_cn,definition_en,example_en,example_cn) VALUES(?,?,?,?,?,?,?)',[m.id,w.id,m.pos,m.definitionCn,m.definitionEn||null,m.exampleEn||null,m.exampleCn||null]);for(const p of w.phonics)await c.query('INSERT INTO word_phonics(id,word_id,sequence_no,text,phonetic,syllable,audio_url) VALUES(?,?,?,?,?,?,?)',[p.id,w.id,p.sequence,p.text,p.phonetic,p.syllable,p.audioUrl||null]);await c.commit();return w}catch(e){await c.rollback();throw e}finally{c.release()}}
  async getWordProgress(userId:string,wordId:string){const [rows]=await pool.query('SELECT * FROM user_word_progress WHERE user_id=? AND word_id=?',[userId,wordId]);return this.progress((rows as Row[])[0])}
  async getAllWordProgresses(userId:string){const [rows]=await pool.query('SELECT * FROM user_word_progress WHERE user_id=?',[userId]);return(rows as Row[]).map(this.progress)}
  private progress(r?:Row):UserWordProgress|undefined{if(!r)return;return{id:r.id,userId:r.user_id,wordId:r.word_id,status:r.status,learnCount:r.learn_count,reviewCount:r.review_count,correctCount:r.correct_count,wrongCount:r.wrong_count,streak:r.streak,mastery:r.mastery,lastLearnAt:iso(r.last_learn_at),lastReviewAt:iso(r.last_review_at),nextReviewAt:iso(r.next_review_at),createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!}}
  async saveWordProgress(p:UserWordProgress){await pool.query(`INSERT INTO user_word_progress(id,user_id,word_id,status,learn_count,review_count,correct_count,wrong_count,streak,mastery,last_learn_at,last_review_at,next_review_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),learn_count=VALUES(learn_count),review_count=VALUES(review_count),correct_count=VALUES(correct_count),wrong_count=VALUES(wrong_count),streak=VALUES(streak),mastery=VALUES(mastery),last_learn_at=VALUES(last_learn_at),last_review_at=VALUES(last_review_at),next_review_at=VALUES(next_review_at),updated_at=VALUES(updated_at)`,[p.id,p.userId,p.wordId,p.status,p.learnCount,p.reviewCount,p.correctCount,p.wrongCount,p.streak,p.mastery,mysqlDate(p.lastLearnAt),mysqlDate(p.lastReviewAt),mysqlDate(p.nextReviewAt),mysqlDate(p.createdAt),mysqlDate(p.updatedAt)]);return p}
  async createStudySession(s:StudySession,words:StudySessionWord[]){const c=await pool.getConnection();try{await c.beginTransaction();await c.query("UPDATE study_session SET status='CANCELLED' WHERE user_id=? AND status='IN_PROGRESS'",[s.userId]);await c.query('INSERT INTO study_session(id,user_id,mode,dictionary_id,total_count,completed_count,exclude_mastered,sort_mode,status,current_word_index,started_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',[s.id,s.userId,s.mode,s.dictionaryId,s.totalCount,s.completedCount,s.excludeMastered,s.sortMode,s.status,s.currentWordIndex,mysqlDate(s.startedAt),mysqlDate(s.createdAt),mysqlDate(s.updatedAt)]);for(const w of words)await c.query('INSERT INTO study_session_word(id,session_id,word_id,sequence_no,learn_status,write_status,completed,is_correct,user_input,learned_at,written_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[w.id,w.sessionId,w.wordId,w.sequence,w.learnStatus,w.writeStatus,w.completed,w.isCorrect,w.userInput,mysqlDate(w.learnedAt),mysqlDate(w.writtenAt),mysqlDate(w.createdAt)]);await c.commit();return s}catch(e){await c.rollback();throw e}finally{c.release()}}
  async findStudySessionById(id:string){const [ss]=await pool.query('SELECT * FROM study_session WHERE id=?',[id]);const s=(ss as Row[])[0];if(!s)return;const [ws]=await pool.query('SELECT * FROM study_session_word WHERE session_id=? ORDER BY sequence_no',[id]);const words=await Promise.all((ws as Row[]).map(async r=>({...this.sw(r),word:await this.findWordById(r.word_id)})));return{...this.session(s),words,dictionary:await this.findDictionaryById(s.dictionary_id)}}
  private session(r:Row):StudySession{return{id:r.id,userId:r.user_id,mode:r.mode,dictionaryId:r.dictionary_id,totalCount:r.total_count,completedCount:r.completed_count,excludeMastered:Boolean(r.exclude_mastered),sortMode:r.sort_mode,status:r.status,currentWordIndex:r.current_word_index,startedAt:iso(r.started_at)!,completedAt:iso(r.completed_at),createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!}}
  private sw(r:Row):StudySessionWord{return{id:r.id,sessionId:r.session_id,wordId:r.word_id,sequence:r.sequence_no,learnStatus:r.learn_status,writeStatus:r.write_status,completed:Boolean(r.completed),isCorrect:r.is_correct===null?null:Boolean(r.is_correct),userInput:r.user_input,learnedAt:iso(r.learned_at)||null,writtenAt:iso(r.written_at)||null,createdAt:iso(r.created_at)!}}
  async getActiveSessionByUserId(userId:string){const [r]=await pool.query("SELECT id FROM study_session WHERE user_id=? AND status='IN_PROGRESS' ORDER BY updated_at DESC LIMIT 1",[userId]);const id=(r as Row[])[0]?.id;return id?this.findStudySessionById(id):undefined}
  async updateStudySession(s:StudySession){await pool.query('UPDATE study_session SET completed_count=?,status=?,current_word_index=?,completed_at=?,updated_at=? WHERE id=?',[s.completedCount,s.status,s.currentWordIndex,mysqlDate(s.completedAt),mysqlDate(s.updatedAt),s.id]);return s}
  async updateStudySessionWord(w:StudySessionWord){await pool.query('UPDATE study_session_word SET learn_status=?,write_status=?,completed=?,is_correct=?,user_input=?,learned_at=?,written_at=? WHERE id=?',[w.learnStatus,w.writeStatus,w.completed,w.isCorrect,w.userInput,mysqlDate(w.learnedAt),mysqlDate(w.writtenAt),w.id]);return w}

  async getAllSentences(){const [r]=await pool.query('SELECT id FROM sentence ORDER BY id');return Promise.all((r as Row[]).map(x=>this.findSentenceById(x.id))) as any}
  async findSentenceById(id:string){const [r]=await pool.execute('SELECT * FROM sentence WHERE id=?',[id]);const s=(r as Row[])[0];if(!s)return;const [sw]=await pool.query('SELECT sw.id, sw.position_no, sw.translation_cn, w.id AS word_id FROM sentence_word sw JOIN word w ON w.id=sw.word_id WHERE sw.sentence_id=? ORDER BY sw.position_no',[id]);const [st]=await pool.query('SELECT * FROM sentence_step WHERE sentence_id=? ORDER BY step_number',[id]);const [an]=await pool.query('SELECT * FROM sentence_analysis WHERE sentence_id=? ORDER BY start_position',[id]);return{id:s.id,content:s.content,translation:s.translation,level:s.level,audioUrl:s.audio_url||undefined,difficulty:s.difficulty,words:(sw as Row[]).map(x=>({id:x.id,sentenceId:id,wordId:x.word_id,position:x.position_no,translationCn:x.translation_cn||undefined})),steps:(st as Row[]).map(x=>({id:x.id,sentenceId:id,stepNumber:x.step_number,content:x.content,translation:x.translation,phonetic:x.phonetic||undefined,type:x.type,audioUrl:x.audio_url||undefined})),analyses:(an as Row[]).map(x=>({id:x.id,sentenceId:id,text:x.text,startPosition:x.start_position,endPosition:x.end_position,type:x.type,explanation:x.explanation}))}}
  async getSentenceProgress(userId:string,sentenceId:string){const[r]=await pool.query('SELECT * FROM user_sentence_progress WHERE user_id=? AND sentence_id=?',[userId,sentenceId]);return this.usp((r as Row[])[0])}
  private usp(r?:Row):UserSentenceProgress|undefined{if(!r)return;return{id:r.id,userId:r.user_id,sentenceId:r.sentence_id,status:r.status,currentStep:r.current_step,completedAt:iso(r.completed_at),createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!}}
  async saveSentenceProgress(p:UserSentenceProgress){await pool.query('INSERT INTO user_sentence_progress(id,user_id,sentence_id,status,current_step,completed_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),current_step=VALUES(current_step),completed_at=VALUES(completed_at),updated_at=VALUES(updated_at)',[p.id,p.userId,p.sentenceId,p.status,p.currentStep,mysqlDate(p.completedAt),mysqlDate(p.createdAt),mysqlDate(p.updatedAt)]);return p}
  async addLearningRecord(r:LearningRecord){await pool.query('INSERT INTO learning_record(id,user_id,item_type,item_id,action,is_correct,input_text,time_spent_sec,created_at) VALUES(?,?,?,?,?,?,?,?,?)',[r.id,r.userId,r.itemType,r.itemId,r.action,r.isCorrect,r.inputText||null,r.timeSpentSec,mysqlDate(r.createdAt)]);return r}
  async getLearningRecords(userId:string){const[r]=await pool.query('SELECT * FROM learning_record WHERE user_id=? ORDER BY created_at',[userId]);return(r as Row[]).map(x=>({id:x.id,userId:x.user_id,itemType:x.item_type,itemId:x.item_id,action:x.action,isCorrect:Boolean(x.is_correct),inputText:x.input_text||undefined,timeSpentSec:x.time_spent_sec,createdAt:iso(x.created_at)!}))}
  async addReviewRecord(r:ReviewRecord){await pool.execute('INSERT INTO review_record(id,user_id,word_id,interval_days,next_review_at,result,created_at) VALUES(?,?,?,?,?,?,?)',[r.id,r.userId,r.wordId,r.intervalDays,mysqlDate(r.nextReviewAt),r.result,mysqlDate(r.createdAt)]);return r}

  async createSentencePracticeSession(s:SentencePracticeSession,items:SentencePracticeItem[]){const c=await pool.getConnection();try{await c.beginTransaction();await c.query("UPDATE sentence_practice_session SET status='CANCELLED' WHERE user_id=? AND status='IN_PROGRESS'",[s.userId]);await c.query('INSERT INTO sentence_practice_session(id,user_id,dictionary_id,difficulty,total_count,current_sentence_index,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',[s.id,s.userId,s.dictionaryId||null,s.difficulty,s.totalCount,s.currentSentenceIndex,s.status,mysqlDate(s.createdAt),mysqlDate(s.updatedAt)]);for(const i of items)await c.query('INSERT INTO sentence_practice_item(id,session_id,sentence_id,sequence_no,current_phase,current_phrase_index,completed,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',[i.id,i.sessionId,i.sentenceId,i.sequence,i.currentPhase,i.currentPhraseIndex,i.completed,mysqlDate(i.createdAt),mysqlDate(i.updatedAt)]);await c.commit();return s}catch(e){await c.rollback();throw e}finally{c.release()}}
  async findSentencePracticeSessionById(id:string){const[r]=await pool.query('SELECT * FROM sentence_practice_session WHERE id=?',[id]);const s=(r as Row[])[0];if(!s)return;const[it]=await pool.query('SELECT * FROM sentence_practice_item WHERE session_id=? ORDER BY sequence_no',[id]);const items=await Promise.all((it as Row[]).map(async x=>{const sentence=await this.findSentenceById(x.sentence_id);return{...this.spi(x),sentence,phrases:sentence?extractSentencePhrases(sentence):[]}}));return{...this.sps(s),items}}
  private sps(r:Row):SentencePracticeSession{return{id:r.id,userId:r.user_id,dictionaryId:r.dictionary_id||undefined,difficulty:r.difficulty,totalCount:r.total_count,currentSentenceIndex:r.current_sentence_index,status:r.status,createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!}}
  private spi(r:Row):SentencePracticeItem{return{id:r.id,sessionId:r.session_id,sentenceId:r.sentence_id,sequence:r.sequence_no,currentPhase:r.current_phase,currentPhraseIndex:r.current_phrase_index,completed:Boolean(r.completed),createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!}}
  async getActiveSentencePracticeSession(userId:string){const[r]=await pool.query("SELECT id FROM sentence_practice_session WHERE user_id=? AND status='IN_PROGRESS' ORDER BY updated_at DESC LIMIT 1",[userId]);const id=(r as Row[])[0]?.id;return id?this.findSentencePracticeSessionById(id):undefined}
  async updateSentencePracticeSession(s:SentencePracticeSession){await pool.query('UPDATE sentence_practice_session SET current_sentence_index=?,status=?,updated_at=? WHERE id=?',[s.currentSentenceIndex,s.status,mysqlDate(s.updatedAt),s.id]);return s}
  async updateSentencePracticeItem(i:SentencePracticeItem){await pool.query('UPDATE sentence_practice_item SET current_phase=?,current_phrase_index=?,completed=?,updated_at=? WHERE id=?',[i.currentPhase,i.currentPhraseIndex,i.completed,mysqlDate(i.updatedAt),i.id]);return i}
  async cancelSentencePracticeSession(id:string,userId:string){const[r]=await pool.query('UPDATE sentence_practice_session SET status=\'CANCELLED\',updated_at=NOW() WHERE id=? AND user_id=?',[id,userId]);return Number((r as any).affectedRows)>0}
}
export const db = new MySQLStorage();
