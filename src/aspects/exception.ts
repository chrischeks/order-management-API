import { afterMethod, beforeMethod, onException } from "kaop-ts";
import { BasicResponse } from "../dto/output/basicresponse";
import { Status } from "../dto/enums/statusenum";
import { IsNumberString } from "class-validator";
import { isNumber } from "util";

export const handleException = (): any => onException(meta => {
  let response = meta.args[1];
  sendResponse(new BasicResponse(Status.ERROR), response);
});

function isMissing(param) {
  return !param;
}

function isNotANumber(param) {
  return !(IsNumberString(param) || isNumber(param));
}

export const simpleList = (schemaName: string): any => afterMethod(async meta => {

  let request = meta.args[0];
  let response = meta.args[1];
  let next = meta.args[2];

  let tenantId = request.app.locals.userobj.organisationId;

  let offset = request.query.offset;
  let limit = request.query.limit;

  if (isMissing(offset) || isNotANumber(offset)) {
    offset = 0;
  }

  if (isMissing(limit) || isNotANumber(limit)) {
    limit = 50;
  }

  let skip = offset * limit;

  let count = 0;

  await request.app.locals[schemaName].count({ tenantId: tenantId }).then(result => {
    count = result;
  });

  request.app.locals[schemaName].find({ tenantId: tenantId }).skip(skip).limit(parseInt(limit)).then(result => {

    if (!result) {
      sendResponse(new BasicResponse(Status.ERROR), response);
      return next();
    } else {
      sendResponse(new BasicResponse(Status.SUCCESS, result, count), response);
      return next();
    }
  }).catch(err => {
    sendResponse(new BasicResponse(Status.ERROR, err), response);
    return next();
  });

});


function sendResponse(serviceResponse: BasicResponse, responseObj): any {
  var clientResponse = {
    status: serviceResponse.getStatusString(),
    data: serviceResponse.getData()
  }

  responseObj.status(getHttpStatus(serviceResponse.getStatusString()));

  responseObj.json(clientResponse);
}



function getHttpStatus(status: string): number {
  switch (status) {
    case 'SUCCESS':
      return 200;
    case 'CREATED':
      return 201;
    case 'FAILED_VALIDATION':
      return 400;
    default:
      return 500;
  }
}