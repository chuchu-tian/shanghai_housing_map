# 开启「全家跨设备实时收藏」——Supabase 设置（一次性）

网站已上线，收藏当前存在各自浏览器本地。要做到**全家任何设备实时同步收藏**，需要接一个免费云数据库（Supabase）。以下 5 步只需做一次，其中只有前几步需要你在浏览器操作，最后把两个值发我即可。

## 步骤

1. 打开 https://supabase.com → 点 **Start your project** → 用 **GitHub 登录**（一键，你已有账号）。
2. 点 **New project**：
   - Name 随便填（如 `shanghai-housing`）
   - Database Password 随便设一个（记不记都行，前端用不到）
   - Region 选离你近的（如 `Northeast Asia (Tokyo)`）
   - 点 **Create new project**，等 1~2 分钟初始化。
3. 左侧进 **SQL Editor** → 新建查询，把下面整段粘进去、点 **Run**（建表 + 开放匿名读写 + 初始化一行）：

   ```sql
   create table if not exists app_state (
     id int primary key,
     doc jsonb not null
   );
   alter table app_state enable row level security;
   -- 无账号协作：允许匿名读写（个人家庭小范围使用；如需更严可后续收紧）
   create policy "anon read"  on app_state for select using (true);
   create policy "anon write" on app_state for insert with check (true);
   create policy "anon update" on app_state for update using (true) with check (true);
   insert into app_state (id, doc)
   values (1, '{"profiles":[{"id":"user1","name":"用户1","blocks":[],"communities":[]},{"id":"user2","name":"用户2","blocks":[],"communities":[]}],"active":"user1","published":[]}')
   on conflict (id) do nothing;
   ```

4. 左侧进 **Project Settings → API**，复制两个值：
   - **Project URL**（形如 `https://xxxx.supabase.co`）
   - **anon public** key（一长串，`anon`/`public` 那个，不是 service_role）

5. **把这两个值发给我**，我填进 `js/config.js` 的 `SUPABASE` 并推送上线，之后全家跨设备收藏就实时同步了。

## 说明

- anon key 是**设计上可公开**的（放前端没问题），实际权限由上面的行级安全策略控制。我们这里为了“无账号全家协作”开放了匿名读写，适合个人小范围；数据只是买房收藏，不敏感。
- 接上后：本地开发(localhost)、线上(Pages)都会自动走云端；连不上云会自动退回本地，不会白屏。
