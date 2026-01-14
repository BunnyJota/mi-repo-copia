select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='public' and tablename in ('appointments','appointment_services');
