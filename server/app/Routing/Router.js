

let Router = new class Router {
	
	constructor() {
		this.endpoints = [];
	}

	// get(path, config) {
	// 	this.endpoints.push({
	// 		method: 'GET',
	// 		path: path,
	// 		config: config
	// 	})
	// }

	// post(path, config) {
	// 	this.endpoints.push({
	// 		method: 'POST',
	// 		path: path,
	// 		config: config
	// 	})
	// }

	addRoute(method, path, config){
		this.endpoints.push({
			method: method,
			path: path,
			config: config
		})
	}

	group(prefix, routes) {
		for(let route of routes) {
			// console.log(route);
			route.path = prefix + route.path;
			this.addRoute(route.method, route.path, route.config);
		}
	}

}

export default Router;