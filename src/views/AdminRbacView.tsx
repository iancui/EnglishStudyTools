import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Users, KeyRound, Save, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client.ts';

interface Props { navigate:(route:string)=>void; user:any; }

export const AdminRbacView: React.FC<Props> = ({ navigate, user }) => {
  const [tab,setTab]=useState<'users'|'roles'>('users');
  const [users,setUsers]=useState<any[]>([]);
  const [roles,setRoles]=useState<any[]>([]);
  const [permissions,setPermissions]=useState<any[]>([]);
  const [selectedUser,setSelectedUser]=useState('');
  const [selectedRole,setSelectedRole]=useState('');
  const [userRoleIds,setUserRoleIds]=useState<string[]>([]);
  const [rolePermissionIds,setRolePermissionIds]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [newRole,setNewRole]=useState({id:'',displayName:'',description:''});

  const isAllowed = user?.role === 'ADMIN'
    || user?.roles?.includes('SUPER_ADMIN')
    || user?.permissions?.includes('role.read')
    || user?.permissions?.includes('user.read');

  const selectedRoleObj=useMemo(()=>roles.find(r=>r.id===selectedRole),[roles,selectedRole]);

  const load=async()=>{
    setLoading(true);
    try {
      const [u,r,p]=await Promise.all([api.getAdminUsers(),api.getAdminRoles(),api.getAdminPermissions()]);
      setUsers(u); setRoles(r); setPermissions(p);
      if(!selectedUser && u[0]) setSelectedUser(u[0].id);
      if(!selectedRole && r[0]) setSelectedRole(r[0].id);
    } catch(e:any){ alert(e?.message||'加载RBAC数据失败'); }
    finally{setLoading(false);}
  };

  useEffect(()=>{ if(isAllowed) load(); },[]);

  useEffect(()=>{
    if(!selectedUser) return;
    api.getUserRoles(selectedUser).then(rs=>setUserRoleIds(rs.map((r:any)=>r.id))).catch(()=>{});
  },[selectedUser]);

  useEffect(()=>{
    if(!selectedRole) return;
    api.getRolePermissions(selectedRole).then(setRolePermissionIds).catch(()=>{});
  },[selectedRole]);

  const saveUserRoles=async()=>{
    try{ await api.setUserRoles(selectedUser,userRoleIds); alert('用户角色已保存'); await load(); }
    catch(e:any){ alert(e?.message||'保存失败'); }
  };

  const saveRolePermissions=async()=>{
    try{ await api.setRolePermissions(selectedRole,rolePermissionIds); alert('角色权限已保存'); }
    catch(e:any){ alert(e?.message||'保存失败'); }
  };

  const createRole=async()=>{
    if(!newRole.id.trim()||!newRole.displayName.trim()) return;
    try{
      await api.createAdminRole({id:newRole.id.trim().toUpperCase(),displayName:newRole.displayName.trim(),description:newRole.description.trim()});
      setNewRole({id:'',displayName:'',description:''}); await load();
    }catch(e:any){alert(e?.message||'创建角色失败');}
  };

  const deleteRole=async()=>{
    if(!selectedRoleObj || selectedRoleObj.isSystem) return;
    if(!confirm('确定删除当前自定义角色吗？')) return;
    try{await api.deleteAdminRole(selectedRole);setSelectedRole('');await load();}catch(e:any){alert(e?.message||'删除失败');}
  };

  if(!isAllowed) return <div className="max-w-md mx-auto py-20 text-center text-stone-500">没有权限访问RBAC管理。</div>;

  if(loading) return <div className="max-w-5xl mx-auto py-20 text-center text-stone-400">加载RBAC配置...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-rose-700 flex items-center gap-2"><Shield className="w-4 h-4"/> RBAC 权限中心</div>
          <h1 className="text-3xl font-bold text-stone-900 mt-1">角色与权限管理</h1>
          <p className="text-sm text-stone-500 mt-1">用户 → 角色 → 权限；前端仅负责展示，真正授权由后端 API 强制执行。</p>
        </div>
        <button onClick={()=>navigate('/admin/dictionaries')} className="px-4 py-2 rounded-xl border border-stone-200 text-sm">返回内容管理</button>
      </div>

      <div className="flex gap-2 border-b border-stone-200">
        <button onClick={()=>setTab('users')} className={`px-4 py-3 text-sm font-semibold ${tab==='users'?'text-stone-900 border-b-2 border-stone-900':'text-stone-400'}`}><Users className="inline w-4 h-4 mr-1"/>用户角色</button>
        <button onClick={()=>setTab('roles')} className={`px-4 py-3 text-sm font-semibold ${tab==='roles'?'text-stone-900 border-b-2 border-stone-900':'text-stone-400'}`}><KeyRound className="inline w-4 h-4 mr-1"/>角色权限</button>
      </div>

      {tab==='users' ? (
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 divide-y">
            {users.map(u=><button key={u.id} onClick={()=>setSelectedUser(u.id)} className={`w-full text-left px-4 py-3 ${selectedUser===u.id?'bg-stone-900 text-white':'hover:bg-stone-50'}`}><div className="font-semibold text-sm">{u.username}</div><div className="text-[11px] opacity-60">{u.email}</div></button>)}
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <h2 className="font-bold text-lg">分配角色</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {roles.map(r=><label key={r.id} className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 hover:bg-stone-50">
                <input type="checkbox" checked={userRoleIds.includes(r.id)} onChange={e=>setUserRoleIds(x=>e.target.checked?[...new Set([...x,r.id])]:x.filter(id=>id!==r.id))} className="mt-1" disabled={r.id==='SUPER_ADMIN' && user?.roles?.includes('SUPER_ADMIN') && selectedUser===user?.id}/>
                <span><span className="block font-semibold text-sm">{r.displayName}</span><span className="block text-[11px] text-stone-400">{r.id}</span></span>
              </label>)}
            </div>
            <button onClick={saveUserRoles} className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold"><Save className="inline w-4 h-4 mr-1"/>保存角色</button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-stone-200 divide-y">
              {roles.map(r=><button key={r.id} onClick={()=>setSelectedRole(r.id)} className={`w-full text-left px-4 py-3 ${selectedRole===r.id?'bg-stone-900 text-white':'hover:bg-stone-50'}`}><div className="font-semibold text-sm">{r.displayName}</div><div className="text-[11px] opacity-60">{r.id}</div></button>)}
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2">
              <div className="font-bold text-sm">新建自定义角色</div>
              <input placeholder="角色ID，如 REVIEWER" value={newRole.id} onChange={e=>setNewRole({...newRole,id:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-xs"/>
              <input placeholder="显示名称" value={newRole.displayName} onChange={e=>setNewRole({...newRole,displayName:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-xs"/>
              <input placeholder="说明（可选）" value={newRole.description} onChange={e=>setNewRole({...newRole,description:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-xs"/>
              <button onClick={createRole} className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs"><Plus className="inline w-3 h-3 mr-1"/>创建</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex justify-between items-center mb-4"><div><h2 className="font-bold text-lg">{selectedRoleObj?.displayName}</h2><p className="text-xs text-stone-400">{selectedRole}</p></div>{selectedRoleObj&&!selectedRoleObj.isSystem&&<button onClick={deleteRole} className="text-rose-600 text-xs"><Trash2 className="inline w-3 h-3 mr-1"/>删除角色</button>}</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[520px] overflow-auto">
              {permissions.map(p=><label key={p.id} className="flex items-start gap-2 p-3 rounded-xl border border-stone-200">
                <input type="checkbox" checked={rolePermissionIds.includes(p.id)} onChange={e=>setRolePermissionIds(x=>e.target.checked?[...new Set([...x,p.id])]:x.filter(id=>id!==p.id))} disabled={selectedRole==='SUPER_ADMIN'} className="mt-1"/>
                <span><span className="block text-xs font-semibold">{p.displayName}</span><span className="block text-[10px] text-stone-400 font-mono">{p.id}</span></span>
              </label>)}
            </div>
            <button onClick={saveRolePermissions} disabled={selectedRole==='SUPER_ADMIN'} className="mt-5 px-5 py-2.5 bg-stone-900 disabled:bg-stone-300 text-white rounded-xl text-sm font-semibold"><Save className="inline w-4 h-4 mr-1"/>保存权限</button>
          </div>
        </div>
      )}
    </div>
  );
};
