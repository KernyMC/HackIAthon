FROM postgres:16

WORKDIR /workspace

COPY infra/sql /workspace/infra/sql
COPY infra/migrator/run_migrations.sh /workspace/run_migrations.sh

RUN sed -i 's/\r$//' /workspace/run_migrations.sh && chmod +x /workspace/run_migrations.sh

ENTRYPOINT ["/workspace/run_migrations.sh"]