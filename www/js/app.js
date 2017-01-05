var app = angular.module('spotbaseApp', ['ionic', 'LocalStorageModule', 'ngCordova']);

app.config(function (localStorageServiceProvider, $compileProvider) {
    localStorageServiceProvider
        .setPrefix('spotbaseApp');

        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);
});

app.controller('mainCtrl', function ($scope, localStorageService, $ionicModal, $http, $cordovaDialogs) {

    var syncKeyData = 'syncKey';
    var lastUpdateData = 'lastUpdate';
    var spotsData = "spots";

    var lastUpdateLocal = null;

    var spottypes = {
        NotSet: 0,
        Curb: 1,
        Ledge: 2,
        Rail: 3,
        Gap: 4,
        Park: 5,
        Creative: 6
    };

    var spots = [];

    //initialize the spots scope with empty array
    $scope.spots = [];

    //initialize the sync key scope with empty object
    $scope.syncKey = { key: ''};

    $scope.types = [
        {
            name: "All",
            value: -1
        },
        {
            name: "Not Set",
            value: 0
        },
        {
            name: "Curb",
            value: 1
        },
        {
            name: "Ledge",
            value: 2
        },
        {
            name: "Rail",
            value: 3
        },
        {
            name: "Gap",
            value: 4
        },
        {
            name: "Park",
            value: 5
        },
        {
            name: "Creative",
            value: 6
        },
    ];

    $scope.selectedType = {
        name: "All",
        value: -1,
    };

    //configure the ionic modal before use
    $ionicModal.fromTemplateUrl('sync-key-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.openSyncKeyModal = modal;
    });

    $scope.init = function () {
        //fetches sync key from local storage       
        if (localStorageService.get(syncKeyData)) {
            $scope.syncKey = localStorageService.get(syncKeyData);
        } else {
            $scope.syncKey = { key: ''};
        }

        if (localStorageService.get(lastUpdateData)) {
            lastUpdateLocal = localStorageService.get(lastUpdateData);
        } 

        if (localStorageService.get(spotsData)) {
            $scope.spots = localStorageService.get(spotsData);
            spots = $scope.spots;
        } 
    }

    $scope.openExternal = function($event){
      if ($event.currentTarget && $event.currentTarget.attributes['data-external'])
      {
        window.open($event.currentTarget.attributes['data-external'].value, '_blank', 'location=yes');
      }
    }

    $scope.updateSpots = function () {
        var baseUrl = "http://URL/TOEXCHANGEDIR/" + $scope.syncKey.key + "/";
        //var baseUrl = "api/" + $scope.syncKey.key + "/";
        
        var updateFileUrl = baseUrl + "lastUpdate.json";
        var lastUpdate = {};

        $http.get(updateFileUrl).then(function(response) {
            lastUpdate = response.data;

            if(lastUpdate){
                
                if(lastUpdateLocal){
                    var localDate = new Date(lastUpdateLocal.lastUpdate);
                    var serverDate = new Date(lastUpdate.lastUpdate);

                    if(localDate != serverDate){
                        updateFromServer(baseUrl, lastUpdate);
                    }
                }
                else {
                    updateFromServer(baseUrl, lastUpdate);
                }
            }
        });
    }

    $scope.typeChanged = function () {

        if($scope.selectedType.value != -1){
            //filter the spots array and set it to scope
            $scope.spots = spots.filter(byType);
        }
        else {
            $scope.spots = spots;
        }

    }

    function updateFromServer(baseUrl, lastUpdate) {

        var spotsUrl = baseUrl + "spots.json";

        $http.get(spotsUrl).then(function(response) {
            var spotsTmp = response.data;

            //save spots locally
            localStorageService.set(spotsData, spotsTmp);

            //set spots in scope
            $scope.spots = spotsTmp;

            spots = $scope.spots;

            //save update date locally
            localStorageService.set(lastUpdateData, lastUpdate);
        });
    }   

    function byType(value){
        return value.type == $scope.selectedType.value;
    }

    $scope.saveSyncKey = function () {
        localStorageService.set(syncKeyData, $scope.syncKey);
        
        //close new task modal
        $scope.openSyncKeyModal.hide();
    }

    $scope.openSyncKey = function () {
        //open new task modal
        $scope.openSyncKeyModal.show();
    };

    $scope.closeSyncKey = function () {
        //close new task modal
        $scope.openSyncKeyModal.hide();
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        $scope.openSyncKeyModal.remove();
    });
});