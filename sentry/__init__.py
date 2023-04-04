__version__ = "13.0.0"

import os
import frappe
import frappe.utils.background_jobs
from frappe.utils.background_jobs import (
	setup_loghandlers,
	get_redis_conn,
	get_queue_list,
	Worker,
	get_worker_name,
)
from rq import Connection


def sentry_log_error(message=None, title=None):
	title = frappe._("Error") if not title else title
	"""Log error to Frappe Error Log and forward to Sentry"""
	try:
		from sentry.sentry.utils import capture_exception

		capture_exception(message, title)
	except Exception as e:
		print("error capturing exception", e)
		pass

	if message:
		if "\n" in title:
			error, title = title, message
		else:
			error = message
	else:
		error = frappe.get_traceback()

	return frappe.get_doc(
		dict(doctype="Error Log", error=frappe.as_unicode(error), method=title)
	).insert(ignore_permissions=True)


def start_worker_with_sentry_logging(queue=None, quiet=False):
	"""Wrapper to start rq worker. Connects to redis and monitors these queues. Includes a Sentry integration"""
	try:
		from sentry.sentry.utils import init_sentry

		init_sentry()
	except Exception as e:
		pass
	with frappe.init_site():
		# empty init is required to get redis_queue from common_site_config.json
		redis_connection = get_redis_conn()

	if os.environ.get("CI"):
		setup_loghandlers("ERROR")

	with Connection(redis_connection):
		queues = get_queue_list(queue)
		logging_level = "INFO"
		if quiet:
			logging_level = "WARNING"
		Worker(queues, name=get_worker_name(queue)).work(logging_level=logging_level)


frappe.log_error = sentry_log_error
frappe.utils.background_jobs.start_worker = start_worker_with_sentry_logging
