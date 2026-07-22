-- PoolParty: Test Seed Data Migration
-- Creates: 250 test users + 25 pools with outcomes and entries
-- Timestamp: 20260619202600

DO $$
DECLARE
  -- User UUIDs (250 users)
  u001 UUID := gen_random_uuid(); u002 UUID := gen_random_uuid(); u003 UUID := gen_random_uuid();
  u004 UUID := gen_random_uuid(); u005 UUID := gen_random_uuid(); u006 UUID := gen_random_uuid();
  u007 UUID := gen_random_uuid(); u008 UUID := gen_random_uuid(); u009 UUID := gen_random_uuid();
  u010 UUID := gen_random_uuid(); u011 UUID := gen_random_uuid(); u012 UUID := gen_random_uuid();
  u013 UUID := gen_random_uuid(); u014 UUID := gen_random_uuid(); u015 UUID := gen_random_uuid();
  u016 UUID := gen_random_uuid(); u017 UUID := gen_random_uuid(); u018 UUID := gen_random_uuid();
  u019 UUID := gen_random_uuid(); u020 UUID := gen_random_uuid(); u021 UUID := gen_random_uuid();
  u022 UUID := gen_random_uuid(); u023 UUID := gen_random_uuid(); u024 UUID := gen_random_uuid();
  u025 UUID := gen_random_uuid(); u026 UUID := gen_random_uuid(); u027 UUID := gen_random_uuid();
  u028 UUID := gen_random_uuid(); u029 UUID := gen_random_uuid(); u030 UUID := gen_random_uuid();
  u031 UUID := gen_random_uuid(); u032 UUID := gen_random_uuid(); u033 UUID := gen_random_uuid();
  u034 UUID := gen_random_uuid(); u035 UUID := gen_random_uuid(); u036 UUID := gen_random_uuid();
  u037 UUID := gen_random_uuid(); u038 UUID := gen_random_uuid(); u039 UUID := gen_random_uuid();
  u040 UUID := gen_random_uuid(); u041 UUID := gen_random_uuid(); u042 UUID := gen_random_uuid();
  u043 UUID := gen_random_uuid(); u044 UUID := gen_random_uuid(); u045 UUID := gen_random_uuid();
  u046 UUID := gen_random_uuid(); u047 UUID := gen_random_uuid(); u048 UUID := gen_random_uuid();
  u049 UUID := gen_random_uuid(); u050 UUID := gen_random_uuid();
  u051 UUID := gen_random_uuid(); u052 UUID := gen_random_uuid(); u053 UUID := gen_random_uuid();
  u054 UUID := gen_random_uuid(); u055 UUID := gen_random_uuid(); u056 UUID := gen_random_uuid();
  u057 UUID := gen_random_uuid(); u058 UUID := gen_random_uuid(); u059 UUID := gen_random_uuid();
  u060 UUID := gen_random_uuid(); u061 UUID := gen_random_uuid(); u062 UUID := gen_random_uuid();
  u063 UUID := gen_random_uuid(); u064 UUID := gen_random_uuid(); u065 UUID := gen_random_uuid();
  u066 UUID := gen_random_uuid(); u067 UUID := gen_random_uuid(); u068 UUID := gen_random_uuid();
  u069 UUID := gen_random_uuid(); u070 UUID := gen_random_uuid(); u071 UUID := gen_random_uuid();
  u072 UUID := gen_random_uuid(); u073 UUID := gen_random_uuid(); u074 UUID := gen_random_uuid();
  u075 UUID := gen_random_uuid(); u076 UUID := gen_random_uuid(); u077 UUID := gen_random_uuid();
  u078 UUID := gen_random_uuid(); u079 UUID := gen_random_uuid(); u080 UUID := gen_random_uuid();
  u081 UUID := gen_random_uuid(); u082 UUID := gen_random_uuid(); u083 UUID := gen_random_uuid();
  u084 UUID := gen_random_uuid(); u085 UUID := gen_random_uuid(); u086 UUID := gen_random_uuid();
  u087 UUID := gen_random_uuid(); u088 UUID := gen_random_uuid(); u089 UUID := gen_random_uuid();
  u090 UUID := gen_random_uuid(); u091 UUID := gen_random_uuid(); u092 UUID := gen_random_uuid();
  u093 UUID := gen_random_uuid(); u094 UUID := gen_random_uuid(); u095 UUID := gen_random_uuid();
  u096 UUID := gen_random_uuid(); u097 UUID := gen_random_uuid(); u098 UUID := gen_random_uuid();
  u099 UUID := gen_random_uuid(); u100 UUID := gen_random_uuid();
  u101 UUID := gen_random_uuid(); u102 UUID := gen_random_uuid(); u103 UUID := gen_random_uuid();
  u104 UUID := gen_random_uuid(); u105 UUID := gen_random_uuid(); u106 UUID := gen_random_uuid();
  u107 UUID := gen_random_uuid(); u108 UUID := gen_random_uuid(); u109 UUID := gen_random_uuid();
  u110 UUID := gen_random_uuid(); u111 UUID := gen_random_uuid(); u112 UUID := gen_random_uuid();
  u113 UUID := gen_random_uuid(); u114 UUID := gen_random_uuid(); u115 UUID := gen_random_uuid();
  u116 UUID := gen_random_uuid(); u117 UUID := gen_random_uuid(); u118 UUID := gen_random_uuid();
  u119 UUID := gen_random_uuid(); u120 UUID := gen_random_uuid(); u121 UUID := gen_random_uuid();
  u122 UUID := gen_random_uuid(); u123 UUID := gen_random_uuid(); u124 UUID := gen_random_uuid();
  u125 UUID := gen_random_uuid(); u126 UUID := gen_random_uuid(); u127 UUID := gen_random_uuid();
  u128 UUID := gen_random_uuid(); u129 UUID := gen_random_uuid(); u130 UUID := gen_random_uuid();
  u131 UUID := gen_random_uuid(); u132 UUID := gen_random_uuid(); u133 UUID := gen_random_uuid();
  u134 UUID := gen_random_uuid(); u135 UUID := gen_random_uuid(); u136 UUID := gen_random_uuid();
  u137 UUID := gen_random_uuid(); u138 UUID := gen_random_uuid(); u139 UUID := gen_random_uuid();
  u140 UUID := gen_random_uuid(); u141 UUID := gen_random_uuid(); u142 UUID := gen_random_uuid();
  u143 UUID := gen_random_uuid(); u144 UUID := gen_random_uuid(); u145 UUID := gen_random_uuid();
  u146 UUID := gen_random_uuid(); u147 UUID := gen_random_uuid(); u148 UUID := gen_random_uuid();
  u149 UUID := gen_random_uuid(); u150 UUID := gen_random_uuid();
  u151 UUID := gen_random_uuid(); u152 UUID := gen_random_uuid(); u153 UUID := gen_random_uuid();
  u154 UUID := gen_random_uuid(); u155 UUID := gen_random_uuid(); u156 UUID := gen_random_uuid();
  u157 UUID := gen_random_uuid(); u158 UUID := gen_random_uuid(); u159 UUID := gen_random_uuid();
  u160 UUID := gen_random_uuid(); u161 UUID := gen_random_uuid(); u162 UUID := gen_random_uuid();
  u163 UUID := gen_random_uuid(); u164 UUID := gen_random_uuid(); u165 UUID := gen_random_uuid();
  u166 UUID := gen_random_uuid(); u167 UUID := gen_random_uuid(); u168 UUID := gen_random_uuid();
  u169 UUID := gen_random_uuid(); u170 UUID := gen_random_uuid(); u171 UUID := gen_random_uuid();
  u172 UUID := gen_random_uuid(); u173 UUID := gen_random_uuid(); u174 UUID := gen_random_uuid();
  u175 UUID := gen_random_uuid(); u176 UUID := gen_random_uuid(); u177 UUID := gen_random_uuid();
  u178 UUID := gen_random_uuid(); u179 UUID := gen_random_uuid(); u180 UUID := gen_random_uuid();
  u181 UUID := gen_random_uuid(); u182 UUID := gen_random_uuid(); u183 UUID := gen_random_uuid();
  u184 UUID := gen_random_uuid(); u185 UUID := gen_random_uuid(); u186 UUID := gen_random_uuid();
  u187 UUID := gen_random_uuid(); u188 UUID := gen_random_uuid(); u189 UUID := gen_random_uuid();
  u190 UUID := gen_random_uuid(); u191 UUID := gen_random_uuid(); u192 UUID := gen_random_uuid();
  u193 UUID := gen_random_uuid(); u194 UUID := gen_random_uuid(); u195 UUID := gen_random_uuid();
  u196 UUID := gen_random_uuid(); u197 UUID := gen_random_uuid(); u198 UUID := gen_random_uuid();
  u199 UUID := gen_random_uuid(); u200 UUID := gen_random_uuid();
  u201 UUID := gen_random_uuid(); u202 UUID := gen_random_uuid(); u203 UUID := gen_random_uuid();
  u204 UUID := gen_random_uuid(); u205 UUID := gen_random_uuid(); u206 UUID := gen_random_uuid();
  u207 UUID := gen_random_uuid(); u208 UUID := gen_random_uuid(); u209 UUID := gen_random_uuid();
  u210 UUID := gen_random_uuid(); u211 UUID := gen_random_uuid(); u212 UUID := gen_random_uuid();
  u213 UUID := gen_random_uuid(); u214 UUID := gen_random_uuid(); u215 UUID := gen_random_uuid();
  u216 UUID := gen_random_uuid(); u217 UUID := gen_random_uuid(); u218 UUID := gen_random_uuid();
  u219 UUID := gen_random_uuid(); u220 UUID := gen_random_uuid(); u221 UUID := gen_random_uuid();
  u222 UUID := gen_random_uuid(); u223 UUID := gen_random_uuid(); u224 UUID := gen_random_uuid();
  u225 UUID := gen_random_uuid(); u226 UUID := gen_random_uuid(); u227 UUID := gen_random_uuid();
  u228 UUID := gen_random_uuid(); u229 UUID := gen_random_uuid(); u230 UUID := gen_random_uuid();
  u231 UUID := gen_random_uuid(); u232 UUID := gen_random_uuid(); u233 UUID := gen_random_uuid();
  u234 UUID := gen_random_uuid(); u235 UUID := gen_random_uuid(); u236 UUID := gen_random_uuid();
  u237 UUID := gen_random_uuid(); u238 UUID := gen_random_uuid(); u239 UUID := gen_random_uuid();
  u240 UUID := gen_random_uuid(); u241 UUID := gen_random_uuid(); u242 UUID := gen_random_uuid();
  u243 UUID := gen_random_uuid(); u244 UUID := gen_random_uuid(); u245 UUID := gen_random_uuid();
  u246 UUID := gen_random_uuid(); u247 UUID := gen_random_uuid(); u248 UUID := gen_random_uuid();
  u249 UUID := gen_random_uuid(); u250 UUID := gen_random_uuid();

  -- Pool UUIDs (25 pools)
  p01 UUID := gen_random_uuid(); p02 UUID := gen_random_uuid(); p03 UUID := gen_random_uuid();
  p04 UUID := gen_random_uuid(); p05 UUID := gen_random_uuid(); p06 UUID := gen_random_uuid();
  p07 UUID := gen_random_uuid(); p08 UUID := gen_random_uuid(); p09 UUID := gen_random_uuid();
  p10 UUID := gen_random_uuid(); p11 UUID := gen_random_uuid(); p12 UUID := gen_random_uuid();
  p13 UUID := gen_random_uuid(); p14 UUID := gen_random_uuid(); p15 UUID := gen_random_uuid();
  p16 UUID := gen_random_uuid(); p17 UUID := gen_random_uuid(); p18 UUID := gen_random_uuid();
  p19 UUID := gen_random_uuid(); p20 UUID := gen_random_uuid(); p21 UUID := gen_random_uuid();
  p22 UUID := gen_random_uuid(); p23 UUID := gen_random_uuid(); p24 UUID := gen_random_uuid();
  p25 UUID := gen_random_uuid();

  -- Outcome UUIDs
  o01a UUID := gen_random_uuid(); o01b UUID := gen_random_uuid();
  o02a UUID := gen_random_uuid(); o02b UUID := gen_random_uuid(); o02c UUID := gen_random_uuid();
  o03a UUID := gen_random_uuid(); o03b UUID := gen_random_uuid();
  o04a UUID := gen_random_uuid(); o04b UUID := gen_random_uuid(); o04c UUID := gen_random_uuid();
  o05a UUID := gen_random_uuid(); o05b UUID := gen_random_uuid();
  o06a UUID := gen_random_uuid(); o06b UUID := gen_random_uuid(); o06c UUID := gen_random_uuid(); o06d UUID := gen_random_uuid();
  o07a UUID := gen_random_uuid(); o07b UUID := gen_random_uuid();
  o08a UUID := gen_random_uuid(); o08b UUID := gen_random_uuid(); o08c UUID := gen_random_uuid();
  o09a UUID := gen_random_uuid(); o09b UUID := gen_random_uuid();
  o10a UUID := gen_random_uuid(); o10b UUID := gen_random_uuid(); o10c UUID := gen_random_uuid();
  o11a UUID := gen_random_uuid(); o11b UUID := gen_random_uuid();
  o12a UUID := gen_random_uuid(); o12b UUID := gen_random_uuid(); o12c UUID := gen_random_uuid();
  o13a UUID := gen_random_uuid(); o13b UUID := gen_random_uuid();
  o14a UUID := gen_random_uuid(); o14b UUID := gen_random_uuid(); o14c UUID := gen_random_uuid();
  o15a UUID := gen_random_uuid(); o15b UUID := gen_random_uuid();
  o16a UUID := gen_random_uuid(); o16b UUID := gen_random_uuid(); o16c UUID := gen_random_uuid();
  o17a UUID := gen_random_uuid(); o17b UUID := gen_random_uuid();
  o18a UUID := gen_random_uuid(); o18b UUID := gen_random_uuid(); o18c UUID := gen_random_uuid();
  o19a UUID := gen_random_uuid(); o19b UUID := gen_random_uuid();
  o20a UUID := gen_random_uuid(); o20b UUID := gen_random_uuid(); o20c UUID := gen_random_uuid();
  o21a UUID := gen_random_uuid(); o21b UUID := gen_random_uuid();
  o22a UUID := gen_random_uuid(); o22b UUID := gen_random_uuid(); o22c UUID := gen_random_uuid();
  o23a UUID := gen_random_uuid(); o23b UUID := gen_random_uuid();
  o24a UUID := gen_random_uuid(); o24b UUID := gen_random_uuid(); o24c UUID := gen_random_uuid();
  o25a UUID := gen_random_uuid(); o25b UUID := gen_random_uuid();

BEGIN

  -- ─── INSERT 250 AUTH USERS ────────────────────────────────────────────────

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (u001,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','alex.johnson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Alex Johnson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u002,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','brianna.smith@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Brianna Smith'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u003,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','carlos.mendez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Carlos Mendez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u004,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','diana.park@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Diana Park'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u005,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ethan.brooks@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ethan Brooks'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u006,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','fatima.ali@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Fatima Ali'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u007,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','gabriel.torres@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Gabriel Torres'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u008,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','hannah.lee@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Hannah Lee'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u009,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ivan.petrov@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ivan Petrov'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u010,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','jasmine.wright@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Jasmine Wright'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u011,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kevin.nguyen@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kevin Nguyen'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u012,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','laura.kim@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Laura Kim'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u013,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','marcus.davis@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Marcus Davis'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u014,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','nina.patel@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Nina Patel'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u015,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','oscar.garcia@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Oscar Garcia'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u016,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','priya.sharma@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Priya Sharma'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u017,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','quincy.adams@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Quincy Adams'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u018,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','rachel.chen@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Rachel Chen'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u019,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','samuel.okafor@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Samuel Okafor'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u020,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tanya.robinson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Tanya Robinson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u021,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ulysses.grant@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ulysses Grant'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u022,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','vanessa.white@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Vanessa White'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u023,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','william.foster@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','William Foster'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u024,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xiomara.reyes@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xiomara Reyes'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u025,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yusuf.hassan@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yusuf Hassan'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u026,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','zoe.martinez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Zoe Martinez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u027,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','aaron.hill@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Aaron Hill'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u028,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','bella.scott@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Bella Scott'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u029,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','caleb.turner@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Caleb Turner'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u030,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','delia.morgan@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Delia Morgan'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u031,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','elijah.cooper@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Elijah Cooper'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u032,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','fiona.reed@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Fiona Reed'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u033,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','george.bell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','George Bell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u034,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','hailey.cox@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Hailey Cox'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u035,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','isaiah.ward@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Isaiah Ward'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u036,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','jade.flores@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Jade Flores'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u037,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kyle.james@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kyle James'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u038,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','lily.watson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Lily Watson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u039,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','mason.brooks@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Mason Brooks'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u040,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','nora.kelly@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Nora Kelly'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u041,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','omar.hussain@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Omar Hussain'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u042,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','paige.nelson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Paige Nelson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u043,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','rafael.santos@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Rafael Santos'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u044,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','sierra.price@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Sierra Price'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u045,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','theo.barnes@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Theo Barnes'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u046,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','uma.diaz@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Uma Diaz'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u047,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','victor.ross@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Victor Ross'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u048,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','wendy.hughes@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Wendy Hughes'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u049,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xander.cole@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xander Cole'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u050,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yasmin.butler@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yasmin Butler'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (u051,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','adam.perry@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Adam Perry'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u052,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','brooke.long@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Brooke Long'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u053,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','chase.patterson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Chase Patterson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u054,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','daisy.simmons@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Daisy Simmons'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u055,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','evan.foster@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Evan Foster'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u056,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','faith.alexander@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Faith Alexander'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u057,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','grant.thomas@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Grant Thomas'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u058,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','holly.jackson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Holly Jackson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u059,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ian.harris@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ian Harris'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u060,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','julia.martin@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Julia Martin'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u061,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kendall.thompson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kendall Thompson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u062,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','liam.garcia@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Liam Garcia'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u063,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','mia.wilson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Mia Wilson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u064,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','noah.anderson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Noah Anderson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u065,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','olivia.taylor@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Olivia Taylor'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u066,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','peter.moore@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Peter Moore'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u067,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','quinn.jackson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Quinn Jackson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u068,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','riley.white@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Riley White'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u069,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','sophia.lewis@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Sophia Lewis'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u070,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tyler.clark@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Tyler Clark'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u071,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ursula.hall@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ursula Hall'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u072,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','vincent.allen@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Vincent Allen'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u073,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','willow.young@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Willow Young'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u074,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xavier.hernandez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xavier Hernandez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u075,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yara.king@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yara King'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u076,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','zach.wright@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Zach Wright'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u077,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','alice.green@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Alice Green'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u078,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','blake.adams@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Blake Adams'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u079,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','chloe.baker@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Chloe Baker'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u080,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','derek.carter@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Derek Carter'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u081,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','elena.mitchell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Elena Mitchell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u082,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','felix.perez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Felix Perez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u083,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','grace.roberts@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Grace Roberts'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u084,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','henry.turner@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Henry Turner'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u085,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','iris.phillips@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Iris Phillips'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u086,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','jake.campbell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Jake Campbell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u087,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kate.parker@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kate Parker'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u088,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','leo.evans@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Leo Evans'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u089,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','maya.edwards@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Maya Edwards'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u090,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','nate.collins@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Nate Collins'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u091,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','opal.stewart@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Opal Stewart'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u092,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','paul.sanchez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Paul Sanchez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u093,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','quinn.morris@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Quinn Morris'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u094,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','rose.rogers@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Rose Rogers'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u095,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','scott.reed@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Scott Reed'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u096,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tessa.cook@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Tessa Cook'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u097,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','umar.morgan@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Umar Morgan'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u098,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','vera.bell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Vera Bell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u099,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','wade.murphy@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Wade Murphy'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u100,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xena.bailey@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xena Bailey'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (u101,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yvonne.rivera@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yvonne Rivera'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u102,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','zane.james@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Zane James'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u103,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','abby.watson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Abby Watson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u104,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ben.brooks@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ben Brooks'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u105,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','cara.gray@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Cara Gray'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u106,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','dan.james@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Dan James'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u107,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','emma.price@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Emma Price'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u108,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','finn.bennett@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Finn Bennett'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u109,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','gina.wood@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Gina Wood'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u110,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','hugo.barnes@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Hugo Barnes'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u111,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','isla.ross@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Isla Ross'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u112,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','jared.henderson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Jared Henderson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u113,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kira.coleman@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kira Coleman'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u114,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','lance.jenkins@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Lance Jenkins'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u115,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','mila.perry@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Mila Perry'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u116,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','neil.powell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Neil Powell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u117,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','olive.long@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Olive Long'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u118,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','pax.hughes@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Pax Hughes'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u119,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','quinn.flores@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Quinn Flores'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u120,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','rex.washington@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Rex Washington'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u121,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','sara.butler@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Sara Butler'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u122,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tom.simmons@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Tom Simmons'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u123,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','una.foster@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Una Foster'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u124,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','vance.gonzalez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Vance Gonzalez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u125,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','wren.nelson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Wren Nelson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u126,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xyla.carter@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xyla Carter'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u127,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yogi.mitchell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yogi Mitchell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u128,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','zola.perez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Zola Perez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u129,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','andy.roberts@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Andy Roberts'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u130,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','bria.turner@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Bria Turner'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u131,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','cole.phillips@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Cole Phillips'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u132,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','dawn.campbell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Dawn Campbell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u133,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','eli.parker@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Eli Parker'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u134,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','faye.evans@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Faye Evans'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u135,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','glen.edwards@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Glen Edwards'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u136,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','hope.collins@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Hope Collins'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u137,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ike.stewart@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ike Stewart'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u138,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','june.sanchez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','June Sanchez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u139,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kent.morris@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kent Morris'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u140,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','luna.rogers@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Luna Rogers'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u141,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','mike.reed@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Mike Reed'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u142,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','nell.cook@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Nell Cook'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u143,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','otto.morgan@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Otto Morgan'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u144,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','pia.bell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Pia Bell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u145,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ray.murphy@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ray Murphy'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u146,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','sky.bailey@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Sky Bailey'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u147,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tad.rivera@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Tad Rivera'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u148,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ula.james@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ula James'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u149,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','vito.watson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Vito Watson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u150,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','willa.brooks@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Willa Brooks'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (u151,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xander.gray@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xander Gray'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u152,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yael.price@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yael Price'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u153,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','zeb.barnes@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Zeb Barnes'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u154,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','anya.diaz@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Anya Diaz'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u155,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','beau.ross@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Beau Ross'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u156,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','cora.hughes@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Cora Hughes'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u157,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','drew.cole@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Drew Cole'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u158,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','eden.butler@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Eden Butler'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u159,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ford.simmons@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ford Simmons'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u160,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','gwen.foster@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Gwen Foster'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u161,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','hank.gonzalez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Hank Gonzalez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u162,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ines.nelson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ines Nelson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u163,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','joel.carter@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Joel Carter'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u164,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kali.mitchell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kali Mitchell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u165,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','lars.perez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Lars Perez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u166,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','mona.roberts@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Mona Roberts'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u167,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','noel.turner@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Noel Turner'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u168,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','orla.phillips@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Orla Phillips'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u169,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','penn.campbell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Penn Campbell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u170,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','remy.parker@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Remy Parker'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u171,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','sage.evans@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Sage Evans'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u172,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tate.edwards@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Tate Edwards'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u173,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','umi.collins@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Umi Collins'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u174,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','vale.stewart@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Vale Stewart'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u175,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','wes.sanchez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Wes Sanchez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u176,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xio.morris@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xio Morris'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u177,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yuki.rogers@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yuki Rogers'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u178,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','zuri.reed@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Zuri Reed'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u179,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','arlo.cook@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Arlo Cook'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u180,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','bex.morgan@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Bex Morgan'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u181,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','cleo.bell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Cleo Bell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u182,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','dex.murphy@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Dex Murphy'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u183,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','esme.bailey@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Esme Bailey'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u184,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','fox.rivera@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Fox Rivera'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u185,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','gem.james@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Gem James'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u186,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','hart.watson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Hart Watson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u187,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','iona.brooks@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Iona Brooks'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u188,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','jax.kelly@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Jax Kelly'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u189,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','koa.hussain@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Koa Hussain'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u190,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','lux.nelson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Lux Nelson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u191,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','max.carter@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Max Carter'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u192,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','nix.mitchell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Nix Mitchell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u193,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ora.perez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ora Perez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u194,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','pip.roberts@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Pip Roberts'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u195,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','rio.turner@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Rio Turner'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u196,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','sol.phillips@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Sol Phillips'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u197,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','taj.campbell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Taj Campbell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u198,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ula.parker@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ula Parker'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u199,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','vex.evans@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Vex Evans'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u200,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','wex.edwards@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Wex Edwards'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (u201,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','abe.collins@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Abe Collins'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u202,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','bev.stewart@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Bev Stewart'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u203,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','cam.sanchez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Cam Sanchez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u204,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','dot.morris@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Dot Morris'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u205,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','edd.rogers@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Edd Rogers'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u206,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','flo.reed@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Flo Reed'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u207,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','gus.cook@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Gus Cook'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u208,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','hal.morgan@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Hal Morgan'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u209,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ida.bell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ida Bell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u210,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','jay.murphy@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Jay Murphy'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u211,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kim.bailey@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kim Bailey'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u212,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','lou.rivera@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Lou Rivera'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u213,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','mae.james@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Mae James'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u214,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ned.watson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ned Watson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u215,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ola.brooks@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ola Brooks'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u216,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','pat.kelly@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Pat Kelly'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u217,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','rob.hussain@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Rob Hussain'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u218,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','sue.nelson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Sue Nelson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u219,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ted.carter@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ted Carter'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u220,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ula.mitchell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ula Mitchell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u221,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','van.perez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Van Perez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u222,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','win.roberts@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Win Roberts'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u223,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xan.turner@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xan Turner'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u224,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yam.phillips@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yam Phillips'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u225,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','zen.campbell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Zen Campbell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u226,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ace.parker@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ace Parker'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u227,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','bay.evans@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Bay Evans'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u228,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','cay.edwards@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Cay Edwards'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u229,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','day.collins@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Day Collins'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u230,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ely.stewart@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ely Stewart'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u231,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','fay.sanchez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Fay Sanchez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u232,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','gay.morris@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Gay Morris'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u233,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','hay.rogers@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Hay Rogers'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u234,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ivy.reed@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ivy Reed'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u235,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','joy.cook@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Joy Cook'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u236,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','kay.morgan@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Kay Morgan'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u237,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','lay.bell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Lay Bell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u238,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','may.murphy@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','May Murphy'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u239,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','nay.bailey@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Nay Bailey'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u240,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','oay.rivera@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Oay Rivera'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u241,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','pay.james@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Pay James'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u242,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','ray.watson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Ray Watson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u243,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','say.brooks@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Say Brooks'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u244,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tay.kelly@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Tay Kelly'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u245,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','uay.hussain@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Uay Hussain'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u246,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','vay.nelson@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Vay Nelson'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u247,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','way.carter@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Way Carter'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u248,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','xay.mitchell@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Xay Mitchell'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u249,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','yay.perez@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Yay Perez'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null),
    (u250,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','zay.roberts@poolparty.test',crypt('Test1234!',gen_salt('bf',10)),now(),now(),now(),jsonb_build_object('full_name','Zay Roberts'),jsonb_build_object('provider','email','providers',ARRAY['email']::TEXT[]),false,false,'',null,'',null,'','',null,'',0,'',null,null,'','',null)
  ON CONFLICT (id) DO NOTHING;

  -- ─── INSERT 25 POOLS ──────────────────────────────────────────────────────

  INSERT INTO public.pools (id, title, description, creator_id, status, pool_type, icon, participant_count, entry_deadline, resolution_deadline, stake_note, rules, created_at)
  VALUES
    (p01, 'Will the Lakers win the NBA Championship?', 'Predict if the LA Lakers take home the title this season.', u001, 'open', 'prediction', '🏀', 18, now() + interval '10 days', now() + interval '60 days', '$25 entry via Venmo', 'Must win the NBA Finals series.', now() - interval '5 days'),
    (p02, 'Super Bowl LX Winner', 'Which team will win Super Bowl LX?', u002, 'open', 'prediction', '🏈', 32, now() + interval '20 days', now() + interval '90 days', '$50 entry via Cash App', 'Winner determined by final score.', now() - interval '4 days'),
    (p03, 'Will BTC hit $150k by end of year?', 'Bitcoin price prediction for year end.', u003, 'open', 'prediction', '₿', 24, now() + interval '30 days', now() + interval '180 days', '$20 entry via Venmo', 'Based on Coinbase closing price on Dec 31.', now() - interval '3 days'),
    (p04, 'World Cup 2026 Champion', 'Which country wins the FIFA World Cup 2026?', u004, 'open', 'prediction', '⚽', 45, now() + interval '15 days', now() + interval '120 days', '$30 entry via PayPal', 'Official FIFA result counts.', now() - interval '6 days'),
    (p05, 'Office March Madness Bracket', 'Who picks the best NCAA bracket in the office?', u005, 'locked', 'prediction', '🏆', 12, now() - interval '1 day', now() + interval '21 days', '$25 entry via Venmo', 'ESPN bracket scoring system used.', now() - interval '8 days'),
    (p06, 'Will Tesla stock hit $400 this quarter?', 'TSLA price prediction for Q3.', u006, 'open', 'prediction', '📈', 16, now() + interval '25 days', now() + interval '75 days', '$15 entry via Cash App', 'Based on NYSE closing price on last trading day of quarter.', now() - interval '2 days'),
    (p07, 'Next iPhone Release Date', 'Will Apple release the new iPhone before September 15?', u007, 'open', 'prediction', '📱', 20, now() + interval '40 days', now() + interval '100 days', '$10 entry via Venmo', 'Official Apple announcement counts.', now() - interval '7 days'),
    (p08, 'Who wins the Masters Golf Tournament?', 'Pick the winner of Augusta National.', u008, 'resolved', 'prediction', '⛳', 28, now() - interval '20 days', now() - interval '5 days', '$25 entry via Venmo', 'Official PGA Tour result.', now() - interval '30 days'),
    (p09, 'Will the Fed cut rates in July?', 'Federal Reserve interest rate decision prediction.', u009, 'open', 'prediction', '🏦', 22, now() + interval '8 days', now() + interval '12 days', '$20 entry via Cash App', 'Based on official FOMC announcement.', now() - interval '1 day'),
    (p10, 'Oscars Best Picture 2027', 'Which film wins Best Picture at the Academy Awards?', u010, 'open', 'prediction', '🎬', 35, now() + interval '60 days', now() + interval '240 days', '$15 entry via Venmo', 'Official Academy Award announcement.', now() - interval '4 days'),
    (p11, 'Fantasy Football Season Champion', 'Who wins the office fantasy football league?', u011, 'open', 'prediction', '🏈', 10, now() + interval '5 days', now() + interval '150 days', '$100 entry via Venmo', 'Based on final league standings.', now() - interval '2 days'),
    (p12, 'Will Elon Musk tweet 100 times this week?', 'Track Elon tweet volume prediction.', u012, 'resolved', 'prediction', '🐦', 14, now() - interval '10 days', now() - interval '3 days', '$5 entry via Cash App', 'Count based on @elonmusk Twitter/X account.', now() - interval '14 days'),
    (p13, 'UFC 310 Main Event Winner', 'Who wins the heavyweight championship bout?', u013, 'open', 'prediction', '🥊', 30, now() + interval '3 days', now() + interval '4 days', '$25 entry via Venmo', 'Official UFC result counts.', now() - interval '1 day'),
    (p14, 'Will it snow in NYC on Christmas?', 'White Christmas prediction for New York City.', u014, 'open', 'prediction', '❄️', 19, now() + interval '90 days', now() + interval '180 days', '$10 entry via Cash App', 'At least 0.1 inch of snow recorded at Central Park on Dec 25.', now() - interval '3 days'),
    (p15, 'Next US Recession Start Date', 'Will the US enter recession before Q1 2027?', u015, 'open', 'prediction', '📉', 26, now() + interval '45 days', now() + interval '270 days', '$50 entry via Venmo', 'Based on official NBER recession declaration.', now() - interval '5 days'),
    (p16, 'Premier League Title Winner 2026-27', 'Which club wins the English Premier League?', u016, 'open', 'prediction', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 38, now() + interval '10 days', now() + interval '300 days', '$30 entry via PayPal', 'Official Premier League table at season end.', now() - interval '6 days'),
    (p17, 'Will ChatGPT-5 launch this year?', 'OpenAI product release prediction.', u017, 'open', 'prediction', '🤖', 21, now() + interval '30 days', now() + interval '180 days', '$20 entry via Venmo', 'Official OpenAI announcement counts.', now() - interval '2 days'),
    (p18, 'Coachella 2027 Headliner', 'Who headlines Coachella 2027 Friday night?', u018, 'open', 'prediction', '🎵', 17, now() + interval '120 days', now() + interval '300 days', '$15 entry via Cash App', 'Official Coachella lineup announcement.', now() - interval '4 days'),
    (p19, 'Will Lionel Messi retire this year?', 'Messi retirement prediction.', u019, 'open', 'prediction', '⚽', 29, now() + interval '20 days', now() + interval '180 days', '$10 entry via Venmo', 'Official announcement from Messi or his club.', now() - interval '3 days'),
    (p20, 'Next Apple CEO After Tim Cook', 'Who becomes Apple CEO when Tim Cook steps down?', u020, 'open', 'prediction', '🍎', 23, now() + interval '60 days', now() + interval '365 days', '$25 entry via Cash App', 'Official Apple board announcement.', now() - interval '7 days'),
    (p21, 'Will gas prices drop below $3 by summer?', 'US national average gas price prediction.', u021, 'open', 'prediction', '⛽', 15, now() + interval '30 days', now() + interval '90 days', '$10 entry via Venmo', 'Based on AAA national average price on July 4.', now() - interval '1 day'),
    (p22, 'Wimbledon 2026 Men Singles Winner', 'Who wins Wimbledon this year?', u022, 'open', 'prediction', '🎾', 27, now() + interval '5 days', now() + interval '30 days', '$20 entry via PayPal', 'Official Wimbledon result.', now() - interval '2 days'),
    (p23, 'Will the housing market crash in 2026?', 'US housing market prediction.', u023, 'open', 'prediction', '🏠', 33, now() + interval '60 days', now() + interval '180 days', '$30 entry via Venmo', 'Defined as 20%+ national median price drop per Case-Shiller index.', now() - interval '5 days'),
    (p24, 'Next Marvel Movie Box Office #1', 'Will the next MCU film open at #1 worldwide?', u024, 'open', 'prediction', '🦸', 11, now() + interval '14 days', now() + interval '21 days', '$15 entry via Cash App', 'Based on opening weekend worldwide box office from Box Office Mojo.', now() - interval '3 days'),
    (p25, 'Office Trivia Night Champion', 'Who wins the monthly office trivia night?', u025, 'locked', 'prediction', '🧠', 8, now() - interval '2 days', now() + interval '1 day', '$10 entry via Venmo', 'Highest score wins. Tiebreaker: fastest correct answer.', now() - interval '5 days')
  ON CONFLICT (id) DO NOTHING;

  -- ─── INSERT POOL OUTCOMES ─────────────────────────────────────────────────

  INSERT INTO public.pool_outcomes (id, pool_id, label, weight, entry_count, total_stake, percent)
  VALUES
    -- Pool 1: Lakers Championship
    (o01a, p01, 'Yes, Lakers win', 120, 10, 250, 56),
    (o01b, p01, 'No, they do not', -110, 8, 200, 44),
    -- Pool 2: Super Bowl
    (o02a, p02, 'AFC Team', -110, 12, 600, 38),
    (o02b, p02, 'NFC Team', 120, 11, 550, 34),
    (o02c, p02, 'Undecided / Other', 250, 9, 450, 28),
    -- Pool 3: BTC $150k
    (o03a, p03, 'Yes, hits $150k', 150, 14, 280, 58),
    (o03b, p03, 'No, stays below', -130, 10, 200, 42),
    -- Pool 4: World Cup
    (o04a, p04, 'Brazil', 200, 15, 450, 33),
    (o04b, p04, 'France', 180, 14, 420, 31),
    (o04c, p04, 'Other nation', 300, 16, 480, 36),
    -- Pool 5: March Madness
    (o05a, p05, 'Alex Johnson', -110, 4, 100, 33),
    (o05b, p05, 'Brianna Smith', 120, 4, 100, 33),
    -- Pool 6: Tesla $400
    (o06a, p06, 'Yes, hits $400', 130, 9, 135, 56),
    (o06b, p06, 'No, stays below', -110, 7, 105, 44),
    -- Pool 7: iPhone date
    (o07a, p07, 'Before Sep 15', -110, 12, 120, 60),
    (o07b, p07, 'Sep 15 or later', 120, 8, 80, 40),
    -- Pool 8: Masters Golf (resolved)
    (o08a, p08, 'Scottie Scheffler', -150, 16, 400, 57),
    (o08b, p08, 'Rory McIlroy', 200, 7, 175, 25),
    (o08c, p08, 'Other player', 350, 5, 125, 18),
    -- Pool 9: Fed rate cut
    (o09a, p09, 'Yes, cut rates', 110, 14, 280, 64),
    (o09b, p09, 'No change or hike', -110, 8, 160, 36),
    -- Pool 10: Oscars Best Picture
    (o10a, p10, 'Studio A film', 150, 12, 180, 34),
    (o10b, p10, 'Studio B film', 200, 11, 165, 31),
    (o10c, p10, 'Independent film', 300, 12, 180, 34),
    -- Pool 11: Fantasy Football
    (o11a, p11, 'Carlos Mendez', -110, 5, 500, 50),
    (o11b, p11, 'Diana Park', 120, 5, 500, 50),
    -- Pool 12: Elon tweets (resolved)
    (o12a, p12, 'Yes, 100+ tweets', 120, 8, 40, 57),
    (o12b, p12, 'No, fewer than 100', -110, 6, 30, 43),
    -- Pool 13: UFC 310
    (o13a, p13, 'Champion retains', -130, 18, 450, 60),
    (o13b, p13, 'Challenger wins', 180, 12, 300, 40),
    -- Pool 14: NYC snow Christmas
    (o14a, p14, 'Yes, white Christmas', 200, 9, 90, 47),
    (o14b, p14, 'No snow', -150, 7, 70, 37),
    (o14c, p14, 'Flurries only', 300, 3, 30, 16),
    -- Pool 15: US Recession
    (o15a, p15, 'Yes, recession by Q1 2027', 150, 14, 700, 54),
    (o15b, p15, 'No recession', -130, 12, 600, 46),
    -- Pool 16: Premier League
    (o16a, p16, 'Manchester City', -120, 14, 420, 37),
    (o16b, p16, 'Arsenal', 150, 13, 390, 34),
    (o16c, p16, 'Other club', 250, 11, 330, 29),
    -- Pool 17: ChatGPT-5
    (o17a, p17, 'Yes, launches this year', -110, 13, 260, 62),
    (o17b, p17, 'No, delayed to next year', 130, 8, 160, 38),
    -- Pool 18: Coachella headliner
    (o18a, p18, 'Taylor Swift', 200, 7, 105, 41),
    (o18b, p18, 'Beyonce', 180, 6, 90, 35),
    (o18c, p18, 'Other artist', 300, 4, 60, 24),
    -- Pool 19: Messi retirement
    (o19a, p19, 'Yes, retires this year', 180, 15, 150, 52),
    (o19b, p19, 'No, plays on', -130, 14, 140, 48),
    -- Pool 20: Apple CEO
    (o20a, p20, 'Jeff Williams', 200, 8, 200, 35),
    (o20b, p20, 'Eddy Cue', 250, 7, 175, 30),
    (o20c, p20, 'External hire', 300, 8, 200, 35),
    -- Pool 21: Gas prices
    (o21a, p21, 'Yes, below $3', 150, 8, 80, 53),
    (o21b, p21, 'No, stays above $3', -130, 7, 70, 47),
    -- Pool 22: Wimbledon
    (o22a, p22, 'Novak Djokovic', -120, 10, 200, 37),
    (o22b, p22, 'Carlos Alcaraz', 130, 10, 200, 37),
    (o22c, p22, 'Other player', 300, 7, 140, 26),
    -- Pool 23: Housing market crash
    (o23a, p23, 'Yes, market crashes', 200, 17, 510, 52),
    (o23b, p23, 'No crash', -150, 16, 480, 48),
    -- Pool 24: Marvel box office
    (o24a, p24, 'Yes, opens at #1', -150, 7, 105, 64),
    (o24b, p24, 'No, another film beats it', 200, 3, 45, 27),
    (o24c, p24, 'Delayed release', 400, 1, 15, 9),
    -- Pool 25: Office Trivia
    (o25a, p25, 'Ethan Brooks', -110, 4, 40, 50),
    (o25b, p25, 'Fatima Ali', 120, 4, 40, 50)
  ON CONFLICT (id) DO NOTHING;

  -- ─── INSERT POOL ENTRIES (sample entries across pools) ───────────────────

  INSERT INTO public.pool_entries (pool_id, user_id, outcome_id, stake_amount)
  VALUES
    (p01, u001, o01a, 25), (p01, u002, o01b, 25), (p01, u003, o01a, 25), (p01, u004, o01b, 25),
    (p01, u005, o01a, 25), (p01, u006, o01a, 25), (p01, u007, o01b, 25), (p01, u008, o01a, 25),
    (p02, u009, o02a, 50), (p02, u010, o02b, 50), (p02, u011, o02c, 50), (p02, u012, o02a, 50),
    (p02, u013, o02b, 50), (p02, u014, o02a, 50), (p02, u015, o02c, 50), (p02, u016, o02b, 50),
    (p03, u017, o03a, 20), (p03, u018, o03b, 20), (p03, u019, o03a, 20), (p03, u020, o03a, 20),
    (p03, u021, o03b, 20), (p03, u022, o03a, 20), (p03, u023, o03a, 20), (p03, u024, o03b, 20),
    (p04, u025, o04a, 30), (p04, u026, o04b, 30), (p04, u027, o04c, 30), (p04, u028, o04a, 30),
    (p04, u029, o04b, 30), (p04, u030, o04c, 30), (p04, u031, o04a, 30), (p04, u032, o04b, 30),
    (p05, u033, o05a, 25), (p05, u034, o05b, 25), (p05, u035, o05a, 25), (p05, u036, o05b, 25),
    (p06, u037, o06a, 15), (p06, u038, o06b, 15), (p06, u039, o06a, 15), (p06, u040, o06a, 15),
    (p07, u041, o07a, 10), (p07, u042, o07b, 10), (p07, u043, o07a, 10), (p07, u044, o07a, 10),
    (p08, u045, o08a, 25), (p08, u046, o08b, 25), (p08, u047, o08c, 25), (p08, u048, o08a, 25),
    (p09, u049, o09a, 20), (p09, u050, o09b, 20), (p09, u051, o09a, 20), (p09, u052, o09a, 20),
    (p10, u053, o10a, 15), (p10, u054, o10b, 15), (p10, u055, o10c, 15), (p10, u056, o10a, 15),
    (p11, u057, o11a, 100), (p11, u058, o11b, 100), (p11, u059, o11a, 100), (p11, u060, o11b, 100),
    (p12, u061, o12a, 5), (p12, u062, o12b, 5), (p12, u063, o12a, 5), (p12, u064, o12a, 5),
    (p13, u065, o13a, 25), (p13, u066, o13b, 25), (p13, u067, o13a, 25), (p13, u068, o13a, 25),
    (p14, u069, o14a, 10), (p14, u070, o14b, 10), (p14, u071, o14c, 10), (p14, u072, o14a, 10),
    (p15, u073, o15a, 50), (p15, u074, o15b, 50), (p15, u075, o15a, 50), (p15, u076, o15a, 50),
    (p16, u077, o16a, 30), (p16, u078, o16b, 30), (p16, u079, o16c, 30), (p16, u080, o16a, 30),
    (p17, u081, o17a, 20), (p17, u082, o17b, 20), (p17, u083, o17a, 20), (p17, u084, o17a, 20),
    (p18, u085, o18a, 15), (p18, u086, o18b, 15), (p18, u087, o18c, 15), (p18, u088, o18a, 15),
    (p19, u089, o19a, 10), (p19, u090, o19b, 10), (p19, u091, o19a, 10), (p19, u092, o19a, 10),
    (p20, u093, o20a, 25), (p20, u094, o20b, 25), (p20, u095, o20c, 25), (p20, u096, o20a, 25),
    (p21, u097, o21a, 10), (p21, u098, o21b, 10), (p21, u099, o21a, 10), (p21, u100, o21a, 10),
    (p22, u101, o22a, 20), (p22, u102, o22b, 20), (p22, u103, o22c, 20), (p22, u104, o22a, 20),
    (p23, u105, o23a, 30), (p23, u106, o23b, 30), (p23, u107, o23a, 30), (p23, u108, o23a, 30),
    (p24, u109, o24a, 15), (p24, u110, o24b, 15), (p24, u111, o24c, 15), (p24, u112, o24a, 15),
    (p25, u113, o25a, 10), (p25, u114, o25b, 10), (p25, u115, o25a, 10), (p25, u116, o25b, 10)
  ON CONFLICT (pool_id, user_id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data insertion error: %', SQLERRM;
END $$;
