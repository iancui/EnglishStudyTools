USE linguastep;

-- 测试账号：
-- admin@linguastep.com / admin123
-- learner@linguastep.com / admin123
INSERT IGNORE INTO users(id,username,email,password_hash,role) VALUES
('u-admin','admin','admin@linguastep.com','scrypt$6c696e677561737465702d746573742d73616c74$3b1cac16101983b911c078e4959ce46448be207c64ebbd21f4ba3f2ed6add8fdb7b0a2450048e9c9f271c8da73d0b9dd69c85af97392eb54f73ded4e87da6af1','ADMIN'),
('u-test','test','learner@linguastep.com','scrypt$6c696e677561737465702d746573742d73616c74$3b1cac16101983b911c078e4959ce46448be207c64ebbd21f4ba3f2ed6add8fdb7b0a2450048e9c9f271c8da73d0b9dd69c85af97392eb54f73ded4e87da6af1','USER');

INSERT IGNORE INTO dictionary(id,name,code,description,owner_type,owner_user_id,is_system,is_public,status) VALUES
('dict-primary-6','小学英语六年级上册','primary_grade_6','测试用系统词典','SYSTEM',NULL,1,1,'ACTIVE'),
('dict-test-sentence','句子练习测试词典','test_sentence','Gemini/句子练习测试数据','SYSTEM',NULL,1,1,'ACTIVE'),
('dict-user-u-test','我的生词本','vocab_test','测试用户生词本','USER','u-test',0,0,'ACTIVE');

INSERT IGNORE INTO word(id,text,phonetic_uk,phonetic_us,pos,difficulty) VALUES
('w-test-1','holiday','/ˈhɒlədeɪ/','/ˈhɑːlədeɪ/','n.',1),
('w-test-2','where','/weə/','/wer/','adv.',1),
('w-test-3','travel','/ˈtrævəl/','/ˈtrævəl/','v.',2),
('w-test-4','school','/skuːl/','/skuːl/','n.',1),
('w-test-5','happy','/ˈhæpi/','/ˈhæpi/','adj.',1);

INSERT IGNORE INTO word_meaning(id,word_id,pos,definition_cn) VALUES
('wm-test-1','w-test-1','n.','假期；假日'),
('wm-test-2','w-test-2','adv.','在哪里；到哪里'),
('wm-test-3','w-test-3','v.','旅行；长途行走'),
('wm-test-4','w-test-4','n.','学校'),
('wm-test-5','w-test-5','adj.','高兴的；幸福的');

INSERT IGNORE INTO word_phonics(id,word_id,sequence_no,text,phonetic,syllable) VALUES
('wp-test-1','w-test-1',1,'hol-i-day','/ˈhɒlədeɪ/','hol-i-day'),
('wp-test-2','w-test-2',1,'where','/weə/','where'),
('wp-test-3','w-test-3',1,'trav-el','/ˈtrævəl/','trav-el'),
('wp-test-4','w-test-4',1,'school','/skuːl/','school'),
('wp-test-5','w-test-5',1,'hap-py','/ˈhæpi/','hap-py');

INSERT IGNORE INTO dictionary_word(id,dictionary_id,word_id,sequence_no,is_active,definition_source) VALUES
('dw-test-1','dict-primary-6','w-test-1',1,1,'Test'),
('dw-test-2','dict-primary-6','w-test-2',2,1,'Test'),
('dw-test-3','dict-primary-6','w-test-3',3,1,'Test'),
('dw-test-4','dict-primary-6','w-test-4',4,1,'Test'),
('dw-test-5','dict-primary-6','w-test-5',5,1,'Test'),
('dw-test-6','dict-user-u-test','w-test-1',1,1,'Test'),
('dw-test-7','dict-user-u-test','w-test-3',2,1,'Test'),
('dw-test-8','dict-user-u-test','w-test-5',3,1,'Test');

INSERT IGNORE INTO sentence(id,content,translation,level,difficulty) VALUES
('s-test-1','Where is your school?','你的学校在哪里？','A1',1),
('s-test-2','I am happy during the holiday.','假期里我很开心。','A1',1),
('s-test-3','We travel together every summer.','我们每年夏天一起旅行。','A2',2);

INSERT IGNORE INTO dictionary_sentence(id,dictionary_id,sentence_id,sequence_no,is_active) VALUES
('ds-test-1','dict-test-sentence','s-test-1',1,1),
('ds-test-2','dict-test-sentence','s-test-2',2,1),
('ds-test-3','dict-test-sentence','s-test-3',3,1),
('ds-test-4','dict-primary-6','s-test-1',1,1),
('ds-test-5','dict-primary-6','s-test-2',2,1);

INSERT IGNORE INTO sentence_word(id,sentence_id,word_id,position_no) VALUES
('sw-test-1','s-test-1','w-test-2',1),
('sw-test-2','s-test-1','w-test-4',2),
('sw-test-3','s-test-2','w-test-1',1),
('sw-test-4','s-test-2','w-test-5',2),
('sw-test-5','s-test-3','w-test-3',1);

INSERT IGNORE INTO sentence_step(id,sentence_id,step_number,content,translation,phonetic,type) VALUES
('ss-test-1','s-test-1',1,'Where','哪里','/weə/','WORD'),
('ss-test-2','s-test-1',2,'Where is','在哪里','/weə ɪz/','PHRASE'),
('ss-test-3','s-test-1',3,'Where is your school?','你的学校在哪里？','/weə ɪz jɔː skuːl/','SENTENCE'),
('ss-test-4','s-test-2',1,'I am happy','我很开心','/aɪ æm ˈhæpi/','PHRASE'),
('ss-test-5','s-test-2',2,'during the holiday','在假期里','/ˈdjʊərɪŋ ðə ˈhɒlədeɪ/','PHRASE'),
('ss-test-6','s-test-2',3,'I am happy during the holiday.','假期里我很开心。','/aɪ æm ˈhæpi ˈdjʊərɪŋ ðə ˈhɒlədeɪ/','SENTENCE');

INSERT IGNORE INTO sentence_analysis(id,sentence_id,text,start_position,end_position,type,explanation) VALUES
('sa-test-1','s-test-1','Where',0,5,'QUESTION','疑问副词，用于询问地点。'),
('sa-test-2','s-test-1','your school',12,23,'NOUN_PHRASE','名词短语，表示你的学校。');

INSERT IGNORE INTO user_dictionary_config(id,user_id,default_dictionary_id,sentence_dictionary_id,phonetic_type,audio_type,enable_phonics,sentence_practice_count) VALUES
('cfg-admin','u-admin','dict-primary-6','dict-test-sentence','UK','UK',1,3),
('cfg-test','u-test','dict-primary-6','dict-test-sentence','UK','UK',1,3);

INSERT IGNORE INTO user_word_progress(id,user_id,word_id,status,learn_count,review_count,correct_count,wrong_count,streak,mastery,next_review_at) VALUES
('p-test-1','u-test','w-test-1','LEARNING',2,1,1,0,1,50,DATE_ADD(NOW(),INTERVAL 1 DAY)),
('p-test-2','u-test','w-test-2','REVIEW',3,2,3,0,3,75,DATE_SUB(NOW(),INTERVAL 1 HOUR));
