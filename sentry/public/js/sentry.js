import * as Sentry from '@sentry/browser'
import { Integrations } from "@sentry/tracing"
import { CaptureConsole, Debug, Offline } from '@sentry/integrations'

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