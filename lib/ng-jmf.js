// TODO: Refactor get / list, Pagination made easy!

angular.module( "JMF", [] ).provider( '$jmf', JMFProvider )

function JMFProvider() {
  var rootUrl = false;
  this.setRoot = function( root ) {
    rootUrl = root;
  }

  this.$get = JMF;
  JMF.$inject = [ '$q', '$http', '$httpParamSerializerJQLike' ];
  function JMF( $q, $http, $httpParamSerializerJQLike ) {

    $http.defaults.paramSerializer = $httpParamSerializerJQLike;

    return {
      setHeader: function( h, v ) { $http.defaults.headers.common[h] = v },
      model: function( m ) { return new Model( $q, $http, rootUrl, m ); }
    }

  }

}




function Model( $q, $http, rootUrl, m ) {

  this.base = rootUrl + m;
  this.model = m;
  var self = this;

  function GET( path, params ) {

    var deferred = $q.defer();
    var promise = deferred.promise;

    $http( {
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
      return deferred.resolve( ret );

    }, function( res ) {

      // Reject
      var err = res.data;
      err.status = res.status;
      return deferred.reject( res.data );

    } );

    return promise;

  }

  this.list = function( opts ) {
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

    return GET( self.base, params ).then( function( ret ) {

      // Add pagination functions
      var meta = ret.meta;
      if( meta.limit && Math.ceil( meta.count / meta.limit ) - 1 > meta.page ) {
        ret.nextPage = function() {
          opts.page = meta.page + 1;
          return self.list( opts );
        }
      }
      if( meta.limit && meta.page ) {
        ret.prevPage = function() {
          opts.page = meta.page - 1;
          return self.list( opts );
        }
      }

      return ret;

    } );
  }

  this.get = function( id, opts ) {
    if( ! opts ) opts = {};

    var params = {
      include: opts.include && (opts.include instanceof Array)
        ? opts.include.join(',')
        : null,
      fields: opts.fields && (opts.fields instanceof Array)
        ? opts.fields.join(',')
        : null
    };

    return GET( self.base + '/' + id, params );
  }

  this.insert = function( obj ) {

    var deferred = $q.defer();
    var promise = deferred.promise;

    var body = {};
    body[ self.model ] = obj;

    $http( {
      method: 'POST',
      url: self.base,
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

  this.update = function( id, obj ) {

    var deferred = $q.defer();
    var promise = deferred.promise;

    var body = {};
    body[ self.model ] = obj;

    $http( {
      method: 'PUT',
      url: self.base + '/' + id,
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

  this.drop = function( id ) {

    var deferred = $q.defer();
    var promise = deferred.promise;

    $http( {
      method: 'DELETE',
      url: self.base + '/' + id
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

}
