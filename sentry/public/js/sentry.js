import * as Sentry from '@sentry/browser'
import { CaptureConsole, Offline } from '@sentry/integrations'
import { Integrations } from "@sentry/tracing"

// website // not app or other portals
if (frappe.hasOwnProperty('is_user_logged_in') && !frappe.is_user_logged_in()) {
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
				Sentry.configureScope(scope => {
					scope.setUser({ email: frappe.session.user })
				})
			}
		}
	})
} else {
	// inside app or other portals
	if (frappe.boot.sentry.dsn) {
		Sentry.init(
			{
				dsn: frappe.boot.sentry.dsn,
				integrations: [
					new Integrations.BrowserTracing({
						beforeNavigate: context => {
							let route = frappe.router.current_route ? frappe.get_route() : ["app"];
							if (route[0].toLowerCase() === "form") {
								route[2] = "<ID>"
							}
							return {
								...context,
								name: route.join("/")
							}
						}
					}),
					new CaptureConsole({ levels: ['warn', 'error', 'debug'] }),
					new Offline({ maxStoredEvents: 25 })
				],
			})

		Sentry.configureScope(scope => {
			scope.setUser({ email: frappe.boot.user.email })
			scope.setTag("site", frappe.boot.sentry.site)
			scope.setTag("project", frappe.boot.sentry.project)
			scope.setTag("server_name", frappe.boot.sentry.server_name)
		})
	}
}