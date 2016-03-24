/*
* Before & after save trigger functions definitions
*/

Parse.Cloud.afterSave("PSPost", function(request) {

	// Query for alle PSPosts that matches the city and the state fields
	var queryCities = new Parse.Query("PSPost");
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
					success: function() { console.log("Cities push notifications, success!") },
					error: function(error) { console.log("Cities push notifications, error!") }
				});
			}
		},
		error: function()
		{
			console.log("Query error!!");
		}
	});


	// Query for alle PSPosts that matches only the state field
	var queryStates = new Parse.Query("PSPost");
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
					success: function() { console.log("States push notifications, success!") },
					error: function(error) { console.log("States push notifications, error!") }
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

	if(request.object.get("email"))
	{
		Parse.Cloud.run('sendgridSendEmailTest',
			{
			  template_name: "tulibroinvitation",
			  subject: "Te ayudamos a encontrar tu permuta",
			  to: request.object.get("email"),
			  from: "hola@permutassep.com",
			  from_name: "Permutas SEP"
			}
		);


		/**
		* Verify if the email has been already registered from the app.
		*/
		var query = new Parse.Query(Parse.User);
		query.equalTo("email", request.object.get("email"));
		query.find({
			success: function(results)
			{
				if (results.length == 0) {

					var Email = Parse.Object.extend("Email");
					var email = new Email();
					email.save({
					  email: request.object.get("email"),
					  source: "tulibrodevisitas"
					});

				} else {
					console.log("Email already registered within the app");
				}
			},
			error: function()
			{
				console.error("Error when validating " + request.object.get("email") + " against the User class");
			}
		});
	}

	var phoneNumbers = request.object.get("phoneNumbers");
	var possiblePhoneNumbers = request.object.get("possiblePhoneNumbers");

	if(phoneNumbers.length > 0 || (possiblePhoneNumbers && possiblePhoneNumbers.length > 0))
	{
		/*
		* Send push to my self to send an SMS invitation
		*/
		Parse.Cloud.useMasterKey();
		var installationQuery = new Parse.Query(Parse.Installation);
		installationQuery.equalTo("PSUser", 1);
		Parse.Push.send({
			where: installationQuery,
			data: {
				alert: "Se acaba de publicar una permuta del estado en el que estás interesado!",
				phone_numbers: request.object.get("phoneNumbers")
			}
		},
		{
			success: function() { console.log("SMS Invitation Push Sent Correctly") },
			error: function(error) { console.log("SMS Invitation Push Not Sent") }
		});
	}
});

Parse.Cloud.afterSave("LPEmail", function(request) {
	Parse.Cloud.run('sendgridSendEmailTest',
		{
		  template_name: "lpsignup",
		  subject: "Gracias por tu interés!",
		  to: request.object.get("email"),
		  from: "hola@permutassep.com",
		  from_name: "Permutas SEP"
		}
	);
});

Parse.Cloud.afterSave("LPContact", function(request) {

	Parse.Cloud.run('sendgridSendEmailTest',
		{
		  template_name: "empty-template",
		  subject: "New contact",
		  to: "hdez.jeduardo@gmail.com",
		  from: "hola@permutassep.com",
		  from_name: "Permutas SEP",
		  text: 'From: ' + request.object.get("email") + '\n\n' + 'Message: ' + '\n\n' + String(request.object.get("message")),
		  html: '<p>' + 'From: ' + request.object.get("email") + '\n\n' + 'Message: ' + '\n\n' + String(request.object.get("message")) + '</p>'
		}
	);

	Parse.Cloud.run('sendgridSendEmailTest',
		{
		  template_name: "lpformcontact",
		  subject: "Gracias por tu interés!",
		  to: request.object.get("email"),
		  from: "hola@permutassep.com",
		  from_name: "Permutas SEP"
		}
	);
});

Parse.Cloud.beforeSave("Email", function(request, response) {
	
	var Email = Parse.Object.extend("Email");
	var query = new Parse.Query(Email);
    query.equalTo("email", request.object.get("email"));
    console.log('request.object.get("email") is equal to: ' + request.object.get("email")); 
    query.first({
      success: function(object) {
        if (object) {
        	console.log("Object equals to " + object);
        	response.error("Email already exists");
        } else {
        	console.log("Email saved correctly");
        	response.success();
        }
      },
      error: function(error) {
        response.error("Could not save new email");
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

Parse.Cloud.define("sendgridSendEmail", function(request, response) {
	Parse.Cloud.httpRequest({
	  method: 'POST',
	  url: 'https://api.sendgrid.com/api/mail.send.json',
	  body: {
		api_user: "lalongooo",
		api_key: "Sand191205-",
		
		subject: request.params.subject,

		to: request.params.to,
		from: "hola@permutassep.com",
		fromname: "Permutas SEP",

		
		text: request.params.text,
		html: request.params.html
		
	  }
	}).then(function(httpResponse) {	  
		console.error('Status. ' + httpResponse.status + ". Message: " + httpResponse.text);
		response.success('Status. ' + httpResponse.status + ". Message: " + httpResponse.text)
	}, function(httpResponse) {	  
		console.error('Status. ' + httpResponse.status + ". Message: " + httpResponse.text);
		response.error('Status. ' + httpResponse.status + ". Message: " + httpResponse.text)
	});
});

Parse.Cloud.define("sendgridSendEmailTest", function(request, response) {
    
    var EmailTemplate = Parse.Object.extend("EmailTemplate");
    var queryTemplate = new Parse.Query(EmailTemplate);
    queryTemplate.equalTo("TemplateName",request.params.template_name);
    queryTemplate.first().then(function(template) {
		Parse.Cloud.httpRequest({
		  method: 'POST',
		  url: 'https://api.sendgrid.com/api/mail.send.json',
		  body: {
			api_user: "lalongooo",
			api_key: "Sand191205-",
			
			subject: request.params.subject,

			to: request.params.to,
			from: request.params.from,
			fromname: request.params.from_name,
			
			text : request.params.text ? request.params.text : template.get("TextVersion"),
			html : request.params.html ? request.params.html : template.get("HtmlContent")
			
		  }
		}).then(function(httpResponse) {	  
			console.error('Status. ' + httpResponse.status + ". Message: " + httpResponse.text);
			response.success('Status. ' + httpResponse.status + ". Message: " + httpResponse.text)
		}, function(httpResponse) {	  
			console.error('Status. ' + httpResponse.status + ". Message: " + httpResponse.text);
			response.error('Status. ' + httpResponse.status + ". Message: " + httpResponse.text)
		});
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

Parse.Cloud.job('sendEmailCampaign', function (request, status) {
  
  var Email = Parse.Object.extend("EmailTest");
  var query = new Parse.Query(Email);
  query.doesNotExist("campaign15032016");
  query.each(function (email) {
	
	Parse.Cloud.run('sendgridSendEmailTest',
		{
		  template_name: "tulibroinvitation",
		  subject: "Te ayudamos a encontrar tu permuta",
		  to: email.get("email"),
		  from: "hola@permutassep.com",
		  from_name: "Permutas SEP"
		}
	);
	
	email.set('campaign15032016', true);
	return email.save();
    
  }).then(function() {
    status.success('Done');
  }, function (error) {
    status.error(String(error));
  });
});

Parse.Cloud.job('sendInvitationToNewUsers', function (request, status) {
  
  var Email = Parse.Object.extend("EmailTest");
  var query = new Parse.Query(Email);
  query.doesNotExist("campaign23032016");
  query.each(function (emailObject) {  	

  	
  	var userQuery = new Parse.Query(Parse.User);
  	userQuery.equalTo("email", emailObject.get("email"));
  	userQuery.first().then(function(userObject) {

  		if(userObject === undefined)
  		{

  			console.log("userObject === null");
  			console.log(emailObject.get("email"));  			
			Parse.Cloud.run('sendgridSendEmailTest',
				{
				  template_name: "tulibroinvitation",
				  subject: "Te ayudamos a encontrar tu permuta",
				  to: emailObject.get("email"),
				  from: "hola@permutassep.com",
				  from_name: "Permutas SEP"
				}
			);
  		} else {
  			console.log(userObject.get("email") + ' already registered within the app');
  		}
  	});
	
	emailObject.set('campaign23032016', true);
	return emailObject.save();
    
  }).then(function() {
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