-- LinguaStep RBAC migration for MySQL 5.7
-- Run once after the current schema is already installed.
USE linguastep;

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(64) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(100) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id VARCHAR(36) NOT NULL,
  role_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  INDEX idx_user_roles_role(role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(64) NOT NULL,
  permission_id VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  INDEX idx_role_permissions_permission(permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO roles(id,display_name,description,is_system) VALUES
('SUPER_ADMIN','超级管理员','拥有系统全部权限',1),
('CONTENT_ADMIN','内容管理员','管理字典、单词、句子及导入内容',1),
('USER_ADMIN','用户管理员','管理用户与角色分配',1),
('TEACHER','教师','查看学习数据与教学相关内容',1),
('USER','普通用户','普通学习用户',1);

INSERT IGNORE INTO permissions(id,display_name,resource,action,description) VALUES
('user.read','查看用户','user','read','查看用户列表与用户信息'),
('user.create','创建用户','user','create','创建用户'),
('user.update','编辑用户','user','update','编辑用户信息'),
('user.delete','删除用户','user','delete','删除用户'),
('user.reset_password','重置密码','user','reset_password','重置用户密码'),
('role.read','查看角色','role','read','查看角色及权限'),
('role.create','创建角色','role','create','创建自定义角色'),
('role.update','编辑角色','role','update','编辑自定义角色'),
('role.delete','删除角色','role','delete','删除自定义角色'),
('role.assign','分配角色','role','assign','给用户分配角色'),
('permission.read','查看权限','permission','read','查看权限定义'),
('dictionary.read','查看字典','dictionary','read','查看后台字典'),
('dictionary.create','创建字典','dictionary','create','创建后台字典'),
('dictionary.update','编辑字典','dictionary','update','编辑后台字典'),
('dictionary.delete','删除字典','dictionary','delete','删除后台字典'),
('dictionary.publish','发布字典','dictionary','publish','发布/启用字典'),
('word.read','查看单词','word','read','查看内容单词'),
('word.create','创建单词','word','create','创建单词'),
('word.update','编辑单词','word','update','编辑单词'),
('word.delete','删除单词','word','delete','删除单词'),
('word.import','导入单词','word','import','批量导入单词'),
('sentence.read','查看句子','sentence','read','查看内容句子'),
('sentence.create','创建句子','sentence','create','创建句子'),
('sentence.update','编辑句子','sentence','update','编辑句子'),
('sentence.delete','删除句子','sentence','delete','删除句子'),
('sentence.import','导入句子','sentence','import','批量导入句子'),
('sentence.publish','发布句子','sentence','publish','发布/启用句子'),
('ai.sentence.generate','AI生成句子','ai.sentence','generate','调用AI生成/分析句子'),
('ai.sentence.import','导入AI句子','ai.sentence','import','将AI结果写入数据库'),
('import.excel','Excel批量导入','import','excel','批量导入Excel内容'),
('learning.self.read','查看自己的学习数据','learning','self.read','查看自己的学习数据'),
('learning.all.read','查看全部学习数据','learning','all.read','查看所有用户学习数据'),
('statistics.self','查看自己的统计','statistics','self','查看自己的统计'),
('statistics.all','查看全部统计','statistics','all','查看全站统计'),
('system.settings','系统设置','system','settings','修改系统设置'),
('system.audit','查看操作日志','system','audit','查看管理员操作日志');

-- 默认角色权限
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'USER', id FROM permissions WHERE id IN ('learning.self.read','statistics.self');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'TEACHER', id FROM permissions WHERE id IN
('learning.self.read','learning.all.read','statistics.self','statistics.all','dictionary.read','word.read','sentence.read');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'CONTENT_ADMIN', id FROM permissions WHERE id IN
('dictionary.read','dictionary.create','dictionary.update','dictionary.delete','dictionary.publish',
 'word.read','word.create','word.update','word.delete','word.import',
 'sentence.read','sentence.create','sentence.update','sentence.delete','sentence.import','sentence.publish',
 'ai.sentence.generate','ai.sentence.import','import.excel');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'USER_ADMIN', id FROM permissions WHERE id IN
('user.read','user.create','user.update','user.delete','user.reset_password',
 'role.read','role.create','role.update','role.delete','role.assign','permission.read');

-- 兼容旧系统：ADMIN 自动升级为超级管理员，USER 自动绑定普通用户角色。
INSERT IGNORE INTO user_roles(user_id,role_id)
SELECT id,'SUPER_ADMIN' FROM users WHERE role='ADMIN';

INSERT IGNORE INTO user_roles(user_id,role_id)
SELECT id,'USER' FROM users WHERE role='USER';

-- 幂等迁移标记。
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO schema_migrations(version) VALUES ('002_rbac');
