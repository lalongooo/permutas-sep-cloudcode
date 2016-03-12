Parse.Cloud.afterSave("PSPost", function(request) {
 
    // Query for alle PSPost that matches the city and the state fields
    var queryCities = new Parse.Query("PSPost");
    queryCities.notEqualTo("user",  request.object.get("user"));
    queryCities.equalTo("place_from_state", request.object.get("place_to_state"));
    queryCities.equalTo("place_from_city",  request.object.get("place_to_city"));
    queryCities.notEqualTo("place_from_town",  request.object.get("place_to_town"));
    queryCities.equalTo("place_to_state", request.object.get("place_from_state"));
    queryCities.equalTo("place_to_city",  request.object.get("place_from_city"));
    queryCities.notEqualTo("place_to_town",  request.object.get("place_from_town"));
    queryCities.find({
        success: function(results)
        {
            if(results.length > 0)
            {
                var usersIds = [];
                for (var i = 0; i < results.length; ++i)
                {
                    var post = results[i];
                    usersIds.push(parseInt(post.get("user")));
                }
 
                /*
                * Send the push notifications
                */
                Parse.Cloud.useMasterKey();
                var queryInstCity = new Parse.Query(Parse.Installation);
                queryInstCity.containedIn("PSUser", usersIds);
                Parse.Push.send({
                    where: queryInstCity,
                    data: {
                        alert: "Se acaba de publicar una permuta del municipio en el que estás interesado!",
						PSPostId: request.object.get("id")
                    }
                },
                {
                    success: function() { console.log("Cities push notificaions, success!") },
                    error: function(error) { console.log("Cities push notificaions, error!") }
                });
            }
        },
        error: function()
        {
            console.log("Query error!!");
        }
    });
 
 
    // Query for alle PSPost that matches only the state field
    var queryStates = new Parse.Query("PSPost");
    queryStates.notEqualTo("user",  request.object.get("user"));
    queryStates.equalTo("place_from_state", request.object.get("place_to_state"));
    queryStates.notEqualTo("place_from_city",  request.object.get("place_to_city"));
    queryStates.notEqualTo("place_from_town",  request.object.get("place_to_town"));
    queryStates.equalTo("place_to_state", request.object.get("place_from_state"));
    queryStates.notEqualTo("place_to_city",  request.object.get("place_from_city"));
    queryStates.notEqualTo("place_to_town",  request.object.get("place_from_town"));
    queryStates.find({
        success: function(results)
        {
            if(results.length > 0)
            {
                var usersIds = [];
                for (var i = 0; i < results.length; ++i)
                {
                    var post = results[i];
                    usersIds.push(parseInt(post.get("user")));
                }
 
                /*
                * Send the push notifications
                */
                Parse.Cloud.useMasterKey();
                var queryInstState = new Parse.Query(Parse.Installation);
                queryInstState.containedIn("PSUser", usersIds);
                Parse.Push.send({
                    where: queryInstState,
                    data: {
                        alert: "Se acaba de publicar una permuta del estado en el que estás interesado!",
						PSPostId: request.object.get("id")
                    }
                },
                {
                    success: function() { console.log("States push notificaions, success!") },
                    error: function(error) { console.log("States push notificaions, error!") }
                });
            }
        },
        error: function()
        {
            console.log("Query error!!");
        }
    });


    // Query for all PSPost that matches all criteria
    var queryTowns = new Parse.Query("PSPost");
    queryTowns.notEqualTo("user",  request.object.get("user"));
    queryTowns.equalTo("place_from_state", request.object.get("place_to_state"));
    queryTowns.equalTo("place_from_city",  request.object.get("place_to_city"));
    queryTowns.equalTo("place_from_town",  request.object.get("place_to_town"));
    queryTowns.equalTo("place_to_state", request.object.get("place_from_state"));
    queryTowns.equalTo("place_to_city",  request.object.get("place_from_city"));
    queryTowns.equalTo("place_to_town",  request.object.get("place_from_town"));
    queryTowns.find({
        success: function(results)
        {
            if(results.length > 0)
            {
                var usersIds = [];
                for (var i = 0; i < results.length; ++i)
                {
                    var post = results[i];
                    usersIds.push(parseInt(post.get("user")));
                }
 
                /*
                * Send the push notifications
                */
                Parse.Cloud.useMasterKey();
                var queryInstState = new Parse.Query(Parse.Installation);
                queryInstState.containedIn("PSUser", usersIds);
                Parse.Push.send({
                    where: queryInstState,
                    data: {
                        alert: "Se acaba de publicar una permuta de la localidad en la que estás interesado!",
						PSPostId: request.object.get("id")
                    }
                },
                {
                    success: function() { console.log("States push notificaions, success!") },
                    error: function(error) { console.log("States push notificaions, error!") }
                });
            }
        },
        error: function()
        {
            console.log("Query error!!");
        }
    });


});


Parse.Cloud.job('postDateMigrationPromise', function (request, status) {

  Parse.Cloud.useMasterKey();
  
  var query = new Parse.Query("PSScrapedPost");
  query.doesNotExist("publication_date");
  query.doesNotExist("host")

  query.each(function (scrapedPost) {
    
    var moment = require('cloud/moment');


    var convertedPostDate = scrapedPost.get('post_date').replace(' de ','-').replace(' del ','-').replace('- ','');
    convertedPostDate = convertedPostDate.replace('Enero','01');
    convertedPostDate = convertedPostDate.replace('Febrero','02');
    convertedPostDate = convertedPostDate.replace('Marzo','03');
    convertedPostDate = convertedPostDate.replace('Abril','04');
    convertedPostDate = convertedPostDate.replace('Mayo','05');
    convertedPostDate = convertedPostDate.replace('Junio','06');
    convertedPostDate = convertedPostDate.replace('Julio','07');
    convertedPostDate = convertedPostDate.replace('Agosto','08');
    convertedPostDate = convertedPostDate.replace('Septiembre','09');
    convertedPostDate = convertedPostDate.replace('Octubre','10');
    convertedPostDate = convertedPostDate.replace('Noviembre','11');
    convertedPostDate = convertedPostDate.replace('Diciembre','12');

    scrapedPost.set('publication_date', new Date(moment(convertedPostDate, "DD-MM-YYYY HH:mm:ss")));

    return scrapedPost.save();

  }).then(function(){
    status.success('Done');
  }, function (error) {
    status.error(String(error));
  });

});