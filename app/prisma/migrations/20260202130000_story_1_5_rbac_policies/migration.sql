-- CreateEnum
CREATE TYPE "RbacModule" AS ENUM (
    'CLIENTS',
    'DISCOVERY',
    'AUDIT',
    'STRATEGY',
    'CONTENT',
    'IMPLEMENTATION',
    'REPORTING',
    'SETTINGS',
    'GOVERNANCE'
);

-- CreateTable
CREATE TABLE "rbac_policies" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "module" "RbacModule" NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_manage" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rbac_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "event_name" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_rbac_policies_role_module" ON "rbac_policies"("role", "module");

-- CreateIndex
CREATE INDEX "idx_rbac_policies_role" ON "rbac_policies"("role");

-- CreateIndex
CREATE INDEX "idx_audit_log_event_created_at" ON "audit_log"("event_name", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_log_actor_id" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "idx_audit_log_request_id" ON "audit_log"("request_id");

-- AddForeignKey
ALTER TABLE "audit_log"
ADD CONSTRAINT "audit_log_actor_id_fkey"
FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed baseline RBAC policies for all roles/modules.
WITH roles(role) AS (
    VALUES
        ('OWNER'::"UserRole"),
        ('STRATEGY'::"UserRole"),
        ('CONTENT'::"UserRole"),
        ('OPERATIONS'::"UserRole")
),
modules(module) AS (
    VALUES
        ('CLIENTS'::"RbacModule"),
        ('DISCOVERY'::"RbacModule"),
        ('AUDIT'::"RbacModule"),
        ('STRATEGY'::"RbacModule"),
        ('CONTENT'::"RbacModule"),
        ('IMPLEMENTATION'::"RbacModule"),
        ('REPORTING'::"RbacModule"),
        ('SETTINGS'::"RbacModule"),
        ('GOVERNANCE'::"RbacModule")
)
INSERT INTO "rbac_policies" (
    "id",
    "role",
    "module",
    "can_view",
    "can_edit",
    "can_manage",
    "updated_at"
)
SELECT
    'rbac_' || lower(r.role::text) || '_' || lower(m.module::text) AS id,
    r.role,
    m.module,
    CASE
        WHEN r.role = 'OWNER' THEN true
        WHEN r.role = 'STRATEGY' AND m.module IN ('CLIENTS', 'DISCOVERY', 'AUDIT', 'STRATEGY', 'CONTENT', 'IMPLEMENTATION', 'REPORTING') THEN true
        WHEN r.role = 'CONTENT' AND m.module IN ('CLIENTS', 'DISCOVERY', 'CONTENT', 'REPORTING') THEN true
        WHEN r.role = 'OPERATIONS' AND m.module IN ('CLIENTS', 'DISCOVERY', 'AUDIT', 'IMPLEMENTATION', 'REPORTING') THEN true
        ELSE false
    END AS can_view,
    CASE
        WHEN r.role = 'OWNER' THEN true
        WHEN r.role = 'STRATEGY' AND m.module IN ('CLIENTS', 'DISCOVERY', 'AUDIT', 'STRATEGY', 'CONTENT', 'REPORTING') THEN true
        WHEN r.role = 'CONTENT' AND m.module = 'CONTENT' THEN true
        WHEN r.role = 'OPERATIONS' AND m.module IN ('AUDIT', 'IMPLEMENTATION') THEN true
        ELSE false
    END AS can_edit,
    CASE
        WHEN r.role = 'OWNER' THEN true
        ELSE false
    END AS can_manage,
    CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN modules m
ON CONFLICT ("role", "module") DO NOTHING;
