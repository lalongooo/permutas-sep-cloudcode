/*
* Before & after save trigger functions definitions
*/

Parse.Cloud.afterSave("PSPosts", function(request) {

	// Query for alle PSPosts that matches the city and the state fields
	var queryCities = new Parse.Query("PSPosts");
	queryCities.notEqualTo("user",  request.object.get("user"));
	// queryCities.equalTo("place_from_state", request.object.get("place_to_state"));
	// queryCities.equalTo("place_from_city",  request.object.get("place_to_city"));
	// queryCities.notEqualTo("place_from_town",  request.object.get("place_to_town"));
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
					usersIds.push(post.get("user"));
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
						alert: "Se acaba de publicar una permuta del municipio en el que estás interesado!"
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


	// Query for alle PSPosts that matches only the state field
	var queryStates = new Parse.Query("PSPosts");
	queryStates.notEqualTo("user",  request.object.get("user"));
	// queryStates.equalTo("place_from_state", request.object.get("place_to_state"));
	// queryStates.notEqualTo("place_from_city",  request.object.get("place_to_city"));
	// queryStates.notEqualTo("place_from_town",  request.object.get("place_to_town"));
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
					usersIds.push(post.get("user"));
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
						alert: "Se acaba de publicar una permuta del estado en el que estás interesado!"
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

Parse.Cloud.afterSave("PSScrapedPost", function(request) {

	// Después de guardar un ScrapedPost:
	// Enviar mail con link de Google Play
	// Guardar Email

	if(request.object.get("email"))
	{

		var email = [];
		email.push({
	        "email" : request.object.get("email")
	    });

		Parse.Cloud.run('sendEmailTemplate', { emails: email, template_name : "tulibroinvitation", from : "jorge@permutassep.com" })
		.then(function(resp) {
			console.log("Function sendEmailTemplate ran successfully!")
		});

		var Email = Parse.Object.extend("Email");
		var email = new Email();

		email.save({
		  email: request.object.get("email"),
		  source: "tulibrodevisitas"
		}, {
		  success: function(email) {
		    // The object was saved successfully.
		  },
		  error: function(email, error) {
		    // The save failed.
		    // error is a Parse.Error with an error code and message.
		  }
		});
	}
});

Parse.Cloud.afterSave("LPEmail", function(request) {
	var Mandrill = require('cloud/mandrill.js');
	var email = [];
	email.push({
        "email" : request.object.get("email")
    });

	Parse.Cloud.run('sendEmailTemplate', { emails: email, template_name : "lpsignup", subject : "Gracias por tu interés!" })
	.then(function(resp) {
		console.log("New user has signed up within the landing page.")
	});
});

Parse.Cloud.afterSave("LPContact", function(request) {
	var Mandrill = require('cloud/mandrill.js');
	Mandrill.sendEmail({
	message: {
	  text: request.object.get("message"),
	  subject: "New contact from permutassep.com: " + request.object.get("email"),
	  from_email: "hola@permutassep.com",
	  from_name: "Permutas SEP",
	  to: [
	    {
	      email: "hdez.jeduardo@gmail.com"
	    }
	  ]
	},
	async: true
	}, {
		success: function(httpResponse) {
			console.log("Email sent!");
		},
		error: function(httpResponse) {
			console.log("Uh oh, something went wrong");
		}
	});

	var email = [];
	email.push({
        "email" : request.object.get("email")
    });

	Parse.Cloud.run('sendEmailTemplate', { emails: email, template_name : "lpformcontact" })
	.then(function(resp) {
		console.log("Thanks for contact - Email sent!")
	});
});

Parse.Cloud.beforeSave("Email", function(request, response) {

	var email = [];
	email.push({
        "email" : request.object.get("email")
    });

	var query = new Parse.Query(Parse.User);
	query.equalTo("email", request.object.get("email"));
	query.find({
		success: function(results)
		{
			if (results.length == 0){

				// Parse.Cloud.run('sendEmail', { emails: email })
				// .then(function(resp) {
				// 	console.log("Function sendEmail ran successfully.")
				// });

				response.success();
			} else {
				response.error("Email already registered within the app");
			}
		},
		error: function()
		{
			response.error("An error occurred while trying to save " + request.object.get("email"));
		}
	});
});


/*
* Cloud Code Functions Definitions
*/

Parse.Cloud.define("countTuLibro", function(request, response) {
	var ScrapedPost = Parse.Object.extend("PSScrapedPost");
	var query = new Parse.Query(ScrapedPost);
	query.doesNotExist("host");
	query.count({
	  success: function(count) {
	    response.success(count);
	  },
	  error: function(error) {
	    response.error("Uh oh, something went wrong");
	  }
	});
});

Parse.Cloud.define("countMelodysoft", function(request, response) {
	var ScrapedPost = Parse.Object.extend("PSScrapedPost");
	var query = new Parse.Query(ScrapedPost);
	query.exists("host");
	query.count({
	  success: function(count) {
	    response.success(count);
	  },
	  error: function(error) {
	    response.error("Uh oh, something went wrong");
	  }
	});
});

Parse.Cloud.define("emptyMelodysoft", function(request, response) {
	var ScrapedPost = Parse.Object.extend("PSScrapedPost");
	var query = new Parse.Query(ScrapedPost);
	query.exists("host");
	query.limit(300).find({
		success: function(results) {
			Parse.Object.destroyAll(results, {
			    success: function() {
			      response.success("Successfully deleted items");
			    },
			    error: function(error) {
			      // An error occurred while deleting one or more of the objects.
			      // If this is an aggregate error, then we can inspect each error
			      // object individually to determine the reason why a particular
			      // object was not deleted.
			      response.error("Uh oh, something went wrong");
			      if (error.code === Parse.Error.AGGREGATE_ERROR) {
			        for (var i = 0; i < error.errors.length; i++) {
			          console.log("Couldn't delete " + error.errors[i].object.id + " due to " + error.errors[i].message);
			        }
			      } else {
			        console.log("Delete aborted because of " + error.message);
			      }
			    },
			  }
			);
		},
		error: function(error) {
			response.error("Uh oh, something went wrong");
		}
	});
});

Parse.Cloud.define("sendEmailTemplate", function(request, response) {

	var Mandrill = require('cloud/mandrill.js');

	Mandrill.sendTemplate(

			request.params.template_name,
			[{
				name: "example name",
				content: "eample content"
			}],
			{
				subject: request.params.subject ? request.params.subject : "Permutas SEP",
		        from_email: request.params.from ? request.params.from : "hola@permutassep.com",
		        from_name: 'Permutas SEP',
		        to: request.params.emails,
		        headers: {
		            'Reply To': 'hola@permutassep.com'
		        },
	            global_merge_vars: [
	                {
	                    "name": "COMPANY",
	                    "content": "Permutas SEP"
	                }
	            ],
		        important: true,
		        track_opens: true,
		        track_clicks: true,
		        inline_css: true,
		        tracking_domain: 'permutassep.com',
		        signing_domain: 'permutassep.com'
			}
		).then(
		function(object) {
			console.log(object);
			response.success("Email sent!");
		},
		function(error) {
			console.log(error);
			response.error("Uh oh, something went wrong");
		});
});

/*
* Cloud Code Job Definitions
*/

Parse.Cloud.job("testJob", function(request, status) {

    var counter = 0;

    // Query for all Email's
    var Email = Parse.Object.extend("Email");
    var query = new Parse.Query(Email);
    query.each(function(email) {

        // Update to plan value passed in
        email.set("modified", 1);
        if (counter % 100 === 0) {
            // Set the  job's progress status
            status.message(counter + " emails processed.");
        }
        counter += 1;
        return email.save();
    }).then(function() {
        // Set the job's success status
        status.success("Job finished correctly!");
    }, function(error) {
        // Set the job's error status
        status.error("Uh oh, something went wrong!");
    });
});

Parse.Cloud.job("postDateMigration", function(request, status) {

  // Set up to modify user data
  Parse.Cloud.useMasterKey();

  // Indicate the moment module is required
  var moment = require('cloud/moment');
  var counter = 0;

  // Query for all episodes
  var PSScrapedPost = Parse.Object.extend("PSScrapedPost");
  var query = new Parse.Query(PSScrapedPost);
  query.doesNotExist("publication_date");
  query.doesNotExist("host");
  query.limit(200);

  query.find({
    success: function(results) {
      var i=0;

      while (results[i]){

        // 28 de Enero del 2016 - 10:04:28

        var convertedPostDate = results[i].get('post_date').replace(' de ','-').replace(' del ','-').replace('- ','');
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

        // 28 01 2016 09:55:46
        results[i].set('publication_date', new Date(moment(convertedPostDate, "DD-MM-YYYY HH:mm:ss")));
        i++;

      }

      Parse.Object.saveAll(results);
        status.success("Date migration completed successfully.");
      },

      error: function(error) {
        status.error("Uh oh, something went wrong with date conversion.");
      }
    });
});

Parse.Cloud.job('postDateMigrationPromise', function (request, status) {

  Parse.Cloud.useMasterKey();

  var query = new Parse.Query("PSScrapedPost");
  
  // Condition to fix dates from tulibrodevisitas.com
  query.doesNotExist("host");

  // Condition to fix dates from gbooks1.melodysoft.com/app?ID=pizarra1
  query.exists("host");

  query.each(function (scrapedPost) {

    var moment = require('cloud/moment');

    /**
    * This is the way to fix the dates of the publication from tulibrodevisitas.com
    */

    // var convertedPostDate = scrapedPost.get('post_date').replace(' de ','-').replace(' del ','-').replace('- ','');
    // convertedPostDate = convertedPostDate.replace('Enero','01');
    // convertedPostDate = convertedPostDate.replace('Febrero','02');
    // convertedPostDate = convertedPostDate.replace('Marzo','03');
    // convertedPostDate = convertedPostDate.replace('Abril','04');
    // convertedPostDate = convertedPostDate.replace('Mayo','05');
    // convertedPostDate = convertedPostDate.replace('Junio','06');
    // convertedPostDate = convertedPostDate.replace('Julio','07');
    // convertedPostDate = convertedPostDate.replace('Agosto','08');
    // convertedPostDate = convertedPostDate.replace('Septiembre','09');
    // convertedPostDate = convertedPostDate.replace('Octubre','10');
    // convertedPostDate = convertedPostDate.replace('Noviembre','11');
    // convertedPostDate = convertedPostDate.replace('Diciembre','12');
    // scrapedPost.set('publication_date', new Date(moment(convertedPostDate, "DD-MM-YYYY HH:mm:ss")));

    /**
	* This is the way to fix the dates of the publication from gbooks1.melodysoft.com/app?ID=pizarra1
    */
    scrapedPost.set('publication_date', new Date(moment(scrapedPost.get('post_date'), "DD/MM/YYYY HH:mm")));
    scrapedPost.set('dateFixed', true);

    return scrapedPost.save();

  }).then(function(){
    status.success('Done');
  }, function (error) {
    status.error(String(error));
  });
});

Parse.Cloud.job('getPhoneNumbers', function (request, status) {

  Parse.Cloud.useMasterKey();

  var query = new Parse.Query("PSScrapedPost");  
  query.doesNotExist("phoneNumbers");
  query.each(function (scrapedPost) {

	var post = scrapedPost.get("post");
	var phoneNumbers = [];
  	var regExp = /(\d{4}[-\.\s]??\d{6}|\d{3}[-\.\s]??\d{3}[-\.\s]??\d{2}[-\.\s]??\d{2}|\d{2}[-\.\s]??\d{2}[-\.\s]??\d{3}[-\.\s]??\d{3}|\d{2}[-\.\s]??\d{2}[-\.\s]??\d{2}[-\.\s]??\d{2}[-\.\s]??\d{2}|\d{2}[-\.\s]??\d{2}[-\.\s]??\d{3}[-\.\s]??\d{1}[-\.\s]??\d{2}|\d{3}[-\.\s]??\d{2}[-\.\s]??\d{1}[-\.\s]??\d{2}[-\.\s]??\d{2}|\d{3}[-\.\s]??\d{1}[-\.\s]??\d{2}[-\.\s]??\d{2}[-\.\s]??\d{2}|\d{3}[-\.\s]??\d{2}[-\.\s]??\d{2}[-\.\s]??\d{1}[-\.\s]??\d{2}|\d{3}[-\.\s]??\d{2}[-\.\s]??\d{2}[-\.\s]??\d{1}[-\.\s]??\d{2}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})/g;	
	var match = regExp.exec(post);

	while (match != null) {
		phoneNumbers.push(match[0]);
	    match = regExp.exec(post);
	}

	scrapedPost.set("phoneNumbers", phoneNumbers);
	scrapedPost.save();

	/**
	* If no phone numbers where found, retrieve all the digits
	* within the text and see if it could be a possible phone number.
	*/
	if(phoneNumbers.length == 0) {

        post = post.replace(/[^\d\+]/g,'');
        if (post.substr(0, 1) == "+") {
        	post = "+" + post.replace(/[^\d]/g,'');
        } else {
        	post = post.replace(/[^\d]/g,'');
        }
        
        if (post.length >= 10)
        {
        	phoneNumbers.push(post);
        	scrapedPost.set("possiblePhoneNumbers", phoneNumbers);
        	scrapedPost.save();
        }		        
	}
    
    return scrapedPost.save();

  }).then(function(){
    status.success('Done');
  }, function (error) {
    status.error(String(error));
  });
});


/*
* Helper functions/code sytax/utilities/etc
*/

// Parse.Cloud.define("testParams", function(request, response) {
// 	// This prints:
// 	// request.params.emails['email'] = lalongooo@yahoo.com
// 	response.success("request.params.emails.length = " + request.params.emails.length);
// });