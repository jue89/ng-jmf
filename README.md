# ngJMF

If you're using Angular and want to talk to the by-accident-framework [JMF](https://github.com/jue89/jmf) this module might be the one you want to use.

## How do I install ngJMF?

Very simple. Use bower:

```
$ bower install https://github.com/jue89/ng-jmf.git
```

## Well. And how do I use ngJMF?

Require the JMF module and setup a connection to your JMF backend.

```javascript
var myApp = angular.module( 'myApp', ['JMF'] );
myApp.service( 'myBackend', function( $jmf ) {
	return $jmf.connect( 'https://awesome-api.my-super-service.net/v1.0/' );
} );
```

Now your backend is available.

### List items

The method `list( options )` displays the items of a model. It also includes pagination and resolving of relationships to other modules ( -> include option ).

```html
<script type="text/javascript">

	myApp.controller( 'myList', function( $scope, myBackend ) {

		// Connect to the JMF model 'https://api.my-super-service.net/v1.0/items'
		var myItems = myBackend.model( 'items' );

		// List all items; 10 on each page
		// Have a look into the code to see all other modifiers for list requests
		$scope.items = myItems.list( { limit: 10 } );

		// $scope.items will store the result and make it available to the view
		// when the request has been finished. In addition it is also a promise:
		$scope.items.then( function( result ) {
			// So something when the request successfully finished
		} ).catch( function( err ) {
			// An error occured ...
		} );

	} );

</script>
<div ng-controller="myList">

	<!-- Meta information will magically appear as shown -->
	Total number of items: {{items.meta.count}}.
	Page {{items.meta.page}}.

	<!-- This is all you need to navigate between pages -->
	<button ng-click="items.prevPage()" ng-show="items.hasPrevPage">&lt; Prev Page</button>
	<button ng-click="items.nextPage()" ng-show="items.hasNextPage">Next Page &gt;</button>

	<!-- All items can be found in the data object -->
	<ul>
		<li ng-repeat="item in items.data">{{item._id}}</li>
	</ul>

</div>
```

### Create items

Item creation is offered by the method `insert( object )`.

```html
<script type="text/javascript">

	myApp.controller( 'myForm', function( $scope, myBackend ) {

		// Connect to the JMF model 'https://api.my-super-service.net/v1.0/items'
		var myItems = myBackend.model( 'items' );

		// Create function will be called from view
		$scope.create = function() {
			myItems.insert( $scope.item ).then( function() {
				// If the request was successful, empty the form
				$scope.item = {};
			} );
		}

	} );

</script>
<div ng-controller="myForm">

	<form ng-submit="create()">
		<input type="text" ng-model="item.test">
		<input type="submit">
	</form>

</div>
```

### Get single item and update

The method `get( id, object )` retrives a single item from the model and `update( id, changeset )` modifies an item.

```html
<script type="text/javascript">

	myApp.controller( 'myEditor', function( $scope, myBackend ) {

		// Connect to the JMF model 'https://api.my-super-service.net/v1.0/items'
		var myItems = myBackend.model( 'items' );

		// Get the item
		myItems.get( 'idOfItem' ).then( function( item ) {
			$scope.item = item;
		} );

		// Update function will be called from view
		$scope.update = function() {

			// Remove _id field since it cannot be modified
			var _id = $scope.item._id;
			delete $scope.item._id;

			// Update item
			myItems.update( _id, $scope.item );

		}

	} );

</script>
<div ng-controller="myEditor">

	<form ng-submit="update()">
		<input type="text" ng-model="item.test">
		<input type="submit">
	</form>

</div>
```

### Drop it like it's hot

Be carefule with method `drop( id )` ...

```html
<script type="text/javascript">

	myApp.controller( 'myEditor', function( $scope, myBackend ) {

		// Connect to the JMF model 'https://api.my-super-service.net/v1.0/items'
		var myItems = myBackend.model( 'items' );

		// Update function will be called from view
		$scope.terminate = function() {

			// Drop the item
			myItems.drop( 'ifOfItem' );

		}

	} );

</script>
<div ng-controller="myTerminator">

	<button ng-click="terminate()">Terminate!</button>

</div>
```
