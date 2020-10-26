// Copyright (c)2020 Quinn Michaels

"use strict"

const request = require("request");
const {EventEmitter} = require("events");

class Twitter {
	constructor(auth) {
		this.version = require("../package.json").version;
    this.events = new EventEmitter();
    this._backoff = {};
		this._endpoint = "https://api.twitter.com/1.1/";
    this._stream = "https://stream.twitter.com/1.1/statuses/filter.json";
		this._upload = "https://upload.twitter.com/1.1/"
		this._request_options = {
			oauth: {
        consumer_key: auth.consumer_key,
        consumer_secret: auth.consumer_secret,
        token: auth.token,
        token_secret: auth.token_secret,
      },
			headers: {
				Accept: "*/*",
				Connection: "close",
				"User-Agent": "quinn-" + this.version,
			}
		};
		this._request = request.defaults(this._request_options);
    this.activeStream = null;
	}

  // check back off satus for a specific endpoint.
	_shouldBackoff(opts) {
    if (!this._backoff.hasOwnProperty(opts.path)) return false;
    const _stop = this._backoff[opts.path] > Date.now();
    if (!_stop) delete this._backoff[opts.path];
    return _stop;
	}

  // helper function to set back off status for an end point based on the api response from the headers.
	_checkBackoff(path, headers) {
    let api = {
      limit: headers["x-rate-limit-limit"] || 15,
      remain: headers["x-rate-limit-remaining"] || 1,
      reset: headers["x-rate-limit-reset"] || Date.now(),
    };

    return new Promise((resolve, reject) => {
      if (headers.status !== "200 OK") {
        reject({
          type: "HTTP_STATUS",
          headers,
          path,
          api,
        });
      }

      if (!api.remain) {
        this._backoff[path] = api.reset;
        reject({
          type: "RATE_LIMIT",
          headers,
          path,
          api
        });
      }
      else {
        resolve({
          type: "SUCCESS",
          headers,
          path,
          api
        });
      }
    })
  }

  // return a formatted endpoint string
	endpoint(path, upload=false) {
		let endpoint = this._endpoint;
    const _endpoint = !upload ? this._endpoint : this._upload;
		return `${_endpoint}${path}.json`;
	}

  // make a proper request to twitter using the this._request local
  // returns a promise
  // request is used as a helper function to get and post
	request(opts) {
    opts.params = opts.params || {};
		opts.upload = opts.upload ? opts.upload : false;
		// build request options
		const _options = {
			method: opts.method ? opts.method.toLowerCase() : "get",
			uri: this.endpoint(opts.path, opts.upload)
		}

		switch (_options.method) {
			case "get":
				_options.qs = opts.params;
				break;
			case "post":
				_options.form = opts.params;
				break;
		}

    // return new promise based on back off api status
    return new Promise((resolve,reject) => {
      // make the request
      if (this._shouldBackoff(opts.path)) {
        reject({type: 'twitter:backoff', err: {path: opts.path, backoff: this._backoff[opts.path]}});
      }

      // make request to twitter
      this._request(_options, (err, res, data) => {
        if (err) reject({type:'twitter:request', err});
				resolve(JSON.parse(data));
				// data = JSON.parse(data);
				//
        // // check backoff status of path and resolve or reject based on the end point api status
        // this._checkBackoff(opts.path, res.headers)
        //   .then(msg => {
        //     resolve({ api:msg.api, data });
        //   })
        //   .catch(err => {
        //     reject({type: 'twitter:checkapi', err, res, data});
        //   });
      });

    });
	}

  // makes a get request
	get(opts) {
		opts.method = "get";
		return this.request(opts);
	}

  // makes a post request
	post(opts) {
    opts.method = "post";
		return this.request(opts);
	}

	// makes a post request
	upload(opts) {
    opts.method = "post";
		opts.upload = true;
		return this.request(opts);
	}

  // open a twitter stream based on a passed in track parameter
  // uses the node event emitter to send events to itself that can be watched for.
  // this is useful when extending twitter into other components.
  stream(track, follow) {
    const _opts = {
      method: "post",
      url: this._stream,
      qs: {
        track,
				follow,
        language: "en",
        stall_warnings: true,
				extended_tweet: true,
      }
    };
    // create initial request with auth & options
    this.activeStream = this._request(_opts);
    this.activeStream.on("response", response => {
      let buffer = "";

      if(response.statusCode !== 200) {
        this.events.emit("twitter:stream:error", { type: "STATUS", err: response });
      }

      response.on("data", data => {
        let index, json;
        buffer += data.toString("utf8");

        // loop over the stream while there is an indexOf new line characters
        while ((index = buffer.indexOf("\r\n")) > -1) {
          json = buffer.slice(0, index);          // grab the json to the first end of line
          buffer = buffer.slice(index + 2);       // set the next buffer content
          if (json.length) {                      // if the json has length try to parse and emit a success/error event
						try {
							this.events.emit("twitter:stream:success", JSON.parse(json));
						} catch (err) {
							console.error(err);
							console.log(JSON.parse(json, null, 2));
							this.events.emit("twitter:stream:error", {type: 'JSON', err:err.toString()})
						}
          }
        }
      }).on("error", err => {
        // response error
        this.events.emit("twitter:stream:error", {type: "RESPONSE", err});
        this.activeStream.abort();
      }).on("end", end => {
        // response end
        this.events.emit("twitter:stream:end", {type: 'END', end});
      });

    }).on("error", err => {
      // request error
      this.events.emit("twitter:stream:error", {type: "REQUEST", err})
      this.activeStream.abort();
    });

    this.activeStream.end();
		return Promise.resolve();
  }
}

module.exports = Twitter;
