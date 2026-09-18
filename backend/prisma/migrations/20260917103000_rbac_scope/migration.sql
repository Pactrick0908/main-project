-- RBAC + scope-based permissions

CREATE TYPE "ScopeType" AS ENUM ('GLOBAL', 'ORGANIZER', 'EVENT');

CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_permission_id_fkey"
  FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_role_scopes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "scope_type" "ScopeType" NOT NULL,
    "scope_id" INTEGER NOT NULL DEFAULT 0,
    "granted_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_role_scopes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_role_scopes_user_id_role_id_scope_type_scope_id_key"
  ON "user_role_scopes"("user_id", "role_id", "scope_type", "scope_id");

CREATE INDEX "user_role_scopes_user_id_idx" ON "user_role_scopes"("user_id");
CREATE INDEX "user_role_scopes_scope_type_scope_id_idx"
  ON "user_role_scopes"("scope_type", "scope_id");

ALTER TABLE "user_role_scopes"
  ADD CONSTRAINT "user_role_scopes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_role_scopes"
  ADD CONSTRAINT "user_role_scopes_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_role_scopes"
  ADD CONSTRAINT "user_role_scopes_granted_by_fkey"
  FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
