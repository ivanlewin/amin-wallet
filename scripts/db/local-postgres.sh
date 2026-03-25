#!/usr/bin/env bash

set -euo pipefail

requested_command="${1:-status}"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required for the local Postgres helper." >&2
  exit 1
fi

brew_prefix="${HOMEBREW_PREFIX:-$(brew --prefix)}"
pg_version="${PG_LOCAL_VERSION:-18}"
pg_ctl="${brew_prefix}/opt/postgresql@${pg_version}/bin/pg_ctl"
initdb="${brew_prefix}/opt/postgresql@${pg_version}/bin/initdb"
psql_bin="${brew_prefix}/opt/postgresql@${pg_version}/bin/psql"
data_dir="${PG_LOCAL_DATA_DIR:-${brew_prefix}/var/postgresql@${pg_version}-amin-wallet}"
log_file="${PG_LOCAL_LOG_FILE:-${brew_prefix}/var/log/postgresql@${pg_version}-amin-wallet.log}"
port="${PG_LOCAL_PORT:-54342}"

if [[ ! -x "${pg_ctl}" || ! -x "${initdb}" || ! -x "${psql_bin}" ]]; then
  echo "Could not find the PostgreSQL ${pg_version} Homebrew binaries." >&2
  exit 1
fi

ensure_log_dir() {
  mkdir -p "$(dirname "${log_file}")"
}

cluster_running() {
  "${pg_ctl}" -D "${data_dir}" status >/dev/null 2>&1
}

ensure_postgres_role() {
  "${psql_bin}" -h 127.0.0.1 -p "${port}" -U "${USER}" -d postgres -v ON_ERROR_STOP=1 -c \
    "do \$\$ begin if not exists (select 1 from pg_roles where rolname = 'postgres') then create role postgres with login superuser password 'postgres'; end if; end \$\$;" \
    >/dev/null
}

start_cluster() {
  ensure_log_dir
  exec "${pg_ctl}" -D "${data_dir}" -l "${log_file}" -o "-p ${port}" start
}

stop_cluster() {
  exec "${pg_ctl}" -D "${data_dir}" stop
}

show_status() {
  exec "${pg_ctl}" -D "${data_dir}" status
}

reset_cluster() {
  if cluster_running; then
    "${pg_ctl}" -D "${data_dir}" stop >/dev/null
  fi

  rm -rf "${data_dir}"
  ensure_log_dir
  "${initdb}" -D "${data_dir}" --auth=trust >/dev/null
  "${pg_ctl}" -D "${data_dir}" -l "${log_file}" -o "-p ${port}" start >/dev/null
  ensure_postgres_role
  echo "Reset complete: PostgreSQL ${pg_version} Amin Wallet cluster recreated at ${data_dir} on port ${port}."
  echo "Next step: pnpm db:migrate"
}

case "${requested_command}" in
  start)
    start_cluster
    ;;
  stop)
    stop_cluster
    ;;
  status)
    show_status
    ;;
  reset)
    reset_cluster
    ;;
  *)
    echo "Usage: ./scripts/db/local-postgres.sh [start|stop|status|reset]" >&2
    exit 1
    ;;
esac
