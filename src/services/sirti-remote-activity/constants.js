const OP_INSERT = 0
const OP_UPDATE = 1
const OP_DELETE = 2
const OP_QUERY = 3
const EXCP_OK = 0
const EXCP_NO_SUCH_DBLINK = 1
const EXCP_NO_SUCH_SCHEMA = 2
const EXCP_MISSING_SCHEMA_OBJECTS = 3
const EXCP_NO_SUCH_SOURCE_SERVICE = 4
const EXCP_NO_SUCH_TARGET_SERVICE = 5
const EXCP_NO_SUCH_SOURCE_CONTEXT = 6
const EXCP_NO_SUCH_TARGET_CONTEXT = 7
const EXCP_NO_SUCH_SESSION = 8
const EXCP_SESSION_NOT_LOADED = 9
const EXCP_SESSION_ALREADY_STORED = 10
const EXCP_INVALID_SESSION_TYPE = 11
const EXCP_INVALID_QUEUE = 12
const EXCP_INVALID_EVENT_TYPE = 13
const EXCP_INVALID_NEED_ACK = 14

export const EXCEPTIONS = `
  exception
    when rm_activity.no_such_dblink then
      :ERRMSG := 'no such dblink: ' || :DBLINK;
      :ERRCODE := ${EXCP_NO_SUCH_DBLINK};
    when rm_activity.no_such_schema then
      :ERRMSG := 'no such schema';
      :ERRCODE := ${EXCP_NO_SUCH_SCHEMA};
    when rm_activity.missing_schema_objects then
      :ERRMSG := 'missing schema objects';
      :ERRCODE := ${EXCP_MISSING_SCHEMA_OBJECTS};
    when rm_activity.no_such_source_service then
      :ERRMSG := 'no such source service';
      :ERRCODE := ${EXCP_NO_SUCH_SOURCE_SERVICE};
    when rm_activity.no_such_target_service then
      :ERRMSG := 'no such target service';
      :ERRCODE := ${EXCP_NO_SUCH_TARGET_SERVICE};
    when rm_activity.no_such_source_context then
      :ERRMSG := 'no such source context';
      :ERRCODE := ${EXCP_NO_SUCH_SOURCE_CONTEXT};
    when rm_activity.no_such_target_context then
      :ERRMSG := 'no such target context';
      :ERRCODE := ${EXCP_NO_SUCH_TARGET_CONTEXT};
    when rm_activity.no_such_session then
      :ERRMSG := 'no such session';
      :ERRCODE := ${EXCP_NO_SUCH_SESSION};
    when rm_activity.session_not_loaded  then
      :ERRMSG := 'session not loaded';
      :ERRCODE := ${EXCP_SESSION_NOT_LOADED};
    when rm_activity.session_already_stored then
      :ERRMSG := 'session already stored';
      :ERRCODE := ${EXCP_SESSION_ALREADY_STORED};
    when rm_activity.invalid_session_type then
      :ERRMSG := 'Invalid session type';
      :ERRCODE := ${EXCP_INVALID_SESSION_TYPE};
    when rm_activity.invalid_queue then
      :ERRMSG := 'Invalid Queue';
      :ERRCODE := ${EXCP_INVALID_QUEUE};
    when rm_activity.invalid_event_type then
      :ERRMSG := 'Invalid Event Type';
      :ERRCODE := ${EXCP_INVALID_EVENT_TYPE};
    when rm_activity.invalid_need_ack then
      :ERRMSG := 'Invalid NEED_ACK';
      :ERRCODE := ${EXCP_INVALID_NEED_ACK};
`
