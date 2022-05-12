import * as Sentry from '@sentry/browser'
import { CaptureConsole, Offline } from '@sentry/integrations'

frappe.ready(function () {
	if (!window.localStorage.getItem('sentry.dsn')) {
		frappe.call({
			method: "sentry.sentry.utils.get_sentry_details",
			callback: function (r) {
				if (r.message) {
					window.localStorage.setItem('sentry.dsn', r.message.dsn)
				}
			}
		})
	}

	if (window.localStorage.getItem('sentry.dsn')) {
		Sentry.init({
			dsn: window.localStorage.getItem('sentry.dsn'),
			integrations: [
				new CaptureConsole({ levels: ['warn', 'error', 'debug'] }),
				new Offline({ maxStoredEvents: 25 })
			],
		})
		if (frappe.sid != "Guest") {
			Sentry.configureScope( scope => {
				scope.setUser({ email: frappe.session.user })
			})
		}
	}
})