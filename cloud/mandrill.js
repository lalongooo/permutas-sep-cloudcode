var mandrillKey = '8UtU3-rL9AipLYu0-hhafg';
Mandrill = require('mandrill')
Mandrill.initialize(mandrillKey);

Mandrill.sendTemplate = function(templateName, templateContent, message) {
    console.log(templateContent);
    request = {}
    request.key = mandrillKey;
    request.template_name = templateName;
    request.template_content = templateContent;
    request.message = message;
    console.log(request);

    return Parse.Cloud.httpRequest({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8;'
        },
        url: 'https://mandrillapp.com/api/1.0/messages/send-template.json',
        body: request
    });
};

module.exports = Mandrill