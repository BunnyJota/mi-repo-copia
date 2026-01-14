select table_name, grantee, privilege_type from information_schema.role_table_grants where table_schema='public' and table_name in ('appointments','appointment_services');
