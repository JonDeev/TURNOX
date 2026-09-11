#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  printf 'Uso: %s --host HOSTNAME --port N --path /ruta --connect-timeout N --max-time N [--ca-file ARCHIVO]\n' "$0" >&2
}
host=''; port=''; path=''; ca_file=''; connect_timeout=''; max_time=''
while (($#)); do
  case "$1" in
    --host) [[ $# -ge 2 ]] || { usage; exit 2; }; host=$2; shift 2 ;;
    --port) [[ $# -ge 2 ]] || { usage; exit 2; }; port=$2; shift 2 ;;
    --path) [[ $# -ge 2 ]] || { usage; exit 2; }; path=$2; shift 2 ;;
    --ca-file) [[ $# -ge 2 ]] || { usage; exit 2; }; ca_file=$2; shift 2 ;;
    --connect-timeout) [[ $# -ge 2 ]] || { usage; exit 2; }; connect_timeout=$2; shift 2 ;;
    --max-time) [[ $# -ge 2 ]] || { usage; exit 2; }; max_time=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done
[[ -n "$host" && "$port" =~ ^[0-9]+$ && "$port" -ge 1 && "$port" -le 65535 && "$path" == /* &&
   "$connect_timeout" =~ ^[1-9][0-9]*$ && "$max_time" =~ ^[1-9][0-9]*$ ]] || {
  usage; exit 2;
}
[[ -z "$ca_file" || -r "$ca_file" ]] || { printf 'FAIL: CA no legible\n' >&2; exit 2; }

curl_args=(--silent --show-error --fail --proto '=https' --tlsv1.2 --tls-max 1.3
  --connect-timeout "$connect_timeout" --max-time "$max_time")
[[ -n "$ca_file" ]] && curl_args+=(--cacert "$ca_file")
printf 'TLS endpoint=https://%s:%s%s\n' "$host" "$port" "$path"
curl "${curl_args[@]}" "https://$host:$port$path" -o /dev/null

openssl_args=(-connect "$host:$port" -servername "$host" -verify_return_error -verify_hostname "$host" -brief)
[[ -n "$ca_file" ]] && openssl_args+=(-CAfile "$ca_file")
openssl s_client "${openssl_args[@]}" </dev/null 2>&1 | sed -n '1,18p'
printf 'PASS-TLS transport_and_hostname host=%s port=%s\n' "$host" "$port"
