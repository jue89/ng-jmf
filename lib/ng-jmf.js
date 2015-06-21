// TODO: Refactor get / list, Pagination made easy!

angular.module( "JMF", [] ).service( '$jmf', [ '$q', '$http', '$httpParamSerializerJQLike', function( $q, $http, $httpParamSerializerJQLike ) {

	// TOC:
	// 1) Backend Class
	// 2) Model Class
	// 3) Service definitions


	// Backend Class \\

	function Backend( rootUrl ) {
		this.rootUrl = rootUrl;
		this.headers = {};
	}

	// Private helper functions

	Backend.prototype._req = function( params ) {

		// Set fields
		params.headers = this.headers;
		params.paramSerializer = $httpParamSerializerJQLike;
		params.url = this.rootUrl + params.url;

		// Perform request and return promise
		return $http( params );

	}

	// Public functions

	Backend.prototype.setHeader = function( h, v ) {

		// Save header
		this.headers[h] = v;

	}

	Backend.prototype.unsetHeader = function( h ) {

		// Remove header
		delete this.headers[h];

	}

	Backend.prototype.model = function( m ) {

		// Create a new instance of model
		return new Model( this, m );

	}


	// Model Class \\

	function Model( b, m ) {
		this.backend = b;
		this.model = m;
	}

	// Private helper functions

	Model.prototype._get = function ( path, params ) {

		var self = this;

		return this.backend._req( {
			method: 'GET',
			url: path,
			params: params
		} ).then( function( res ) {

			// If object with model name is not included, something went wrong
			if( ! res.data[ self.model ] ) return deferred.reject( res.data );

			// Otherwise ... here we go
			var ret = {
				meta: res.data.meta,
				data: res.data[ self.model ],
				related: {}
			};

			// Resolve includes
			if( params.include ) params.include.split(',').forEach( function( i ) {

				var foreignModel = res.data.links[i][0];
				var foreignKey = res.data.links[i][1];

				// Skip objects related to this and just refer to them
				if( foreignKey != '_id' ) {

					ret.related[ foreignModel ] = res.data.linked[ foreignModel ];

				} else {

					// Build directory of foreign objects
					var linked = {};
					res.data.linked[ foreignModel ].forEach( function( fi ) {
						linked[ fi._id ] = fi;
					} )

					// Iterate through result
					ret.data.forEach( function( li ) {

						if( li[ i ] instanceof Array ) {
							// Iterate through all objects and replace them
							for( var c = 0; c < li[ i ].length; c++ ) {
								li[i][c] = linked[ li[i][c] ]
							}
						} else {
							// Lookup foreign object and replace
							li[ i ] = linked[ li[ i ] ];
						}

					} );
				}

			} );

			// And finish
			return ret;

		} );

	}

	Model.prototype._updatePromise = function( p, opts ) {

		// Resolve options
		if( ! opts ) opts = {};
		var params = {
			include: opts.include && (opts.include instanceof Array)
				? opts.include.join(',')
				: null,
			filter: opts.filter
				? opts.filter
				: null,
			fields: opts.fields && (opts.fields instanceof Array)
				? opts.fields.join(',')
				: null,
			sort: opts.sort
				? opts.sort
				: null,
			limit: opts.limit
				? opts.limit
				: null,
			page: opts.page
				? opts.page
				: null,
		};

		return this._get( this.model, params ).then( function( ret ) {

			// Save variables from response
			p.data = ret.data;
			p.meta = ret.meta;
			p.related = ret.related;

			// Some additional meta information
			var m = ret.meta;
			p.hasNextPage = m.limit && Math.ceil( m.count / m.limit ) - 1 > m.page;
			p.hasPrevPage = m.limit && m.page;

		} );

	}

	// Public functions

	Model.prototype.list = function( opts ) {

		var self = this;

		// Create promise
		var d = $q.defer();
		var p = d.promise;

		// Install helper functions
		p.nextPage = function() {
			opts.page = p.meta.page + 1;
			self._updatePromise( p, opts );
		}
		p.prevPage = function() {
			opts.page = p.meta.page ? p.meta.page - 1 : 0;
			self._updatePromise( p, opts );
		}

		// And fire the request
		self._updatePromise( p, opts ).then( d.resolve, d.reject );

		// Return the promise
		return p;

	}

	Model.prototype.get = function( id, opts ) {

		if( ! opts ) opts = {};

		var params = {
			include: opts.include && (opts.include instanceof Array)
				? opts.include.join(',')
				: null,
			fields: opts.fields && (opts.fields instanceof Array)
				? opts.fields.join(',')
				: null
		};

		return this._get( self.model + '/' + id, params );

	}

	Model.prototype.insert = function( obj ) {

		var self = this;

		var deferred = $q.defer();
		var promise = deferred.promise;

		var body = {};
		body[ self.model ] = obj;

		this.backend._req( {
			method: 'POST',
			url: self.model,
			data: body
		} ).then( function( res ) {

			// If object with model name is not included, something went wrong
			if( ! res.data[ self.model ] ) return deferred.reject( res.data );

			// And finish
			return deferred.resolve( res.data[ self.model ] );

		}, function( res ) {

			// Reject
			var err = res.data;
			err.status = res.status;
			return deferred.reject( err );

		} );

		return promise;

	}

	Model.prototype.update = function( id, obj ) {

		var self = this;

		var deferred = $q.defer();
		var promise = deferred.promise;

		var body = {};
		body[ self.model ] = obj;

		this.backend._req( {
			method: 'PUT',
			url: self.model + '/' + id,
			data: body
		} ).then( function( res ) {

			// If object with model name is not included, something went wrong
			if( ! res.data[ self.model ] ) return deferred.reject( res.data );

			// And finish
			return deferred.resolve( res.data[ self.model ] );

		}, function( res ) {

			// Reject
			var err = res.data;
			err.status = res.status;
			return deferred.reject( err );

		} );

		return promise;

	}

	Model.prototype.drop = function( id ) {

		var self = this;

		var deferred = $q.defer();
		var promise = deferred.promise;

		this.backend._req( {
			method: 'DELETE',
			url: self.model + '/' + id
		} ).then( function( res ) {

			// And finish
			return deferred.resolve();

		}, function( res ) {

			// Reject
			var err = res.data;
			err.status = res.status;
			return deferred.reject( err );

		} );

		return promise;

	}


	// Exposed functions
	function _connect( rootUrl ) {
		return new Backend( rootUrl );
	}

	// And expose ...
	return { connect: _connect };

} ] );
