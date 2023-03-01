// Copyright (c) 2022 Quinn Michaels

"use strict";

const fs = require("fs");
const Twitter = require('./src');

// recurse funtion here

// twitter server class extends the twitter promise library
class TwitterServer extends Twitter {
  constructor(opts) {
    super(opts.auth);
    this.screen_name = opts.screen_name;
  }

  verify_credentials() {
    return this.get({
      path: 'account/verify_credentials',
      params: {
        include_entities: false,
        skip_status: true,
        include_email: false,
      }
    })
  }
  // set settings for logged in account
  account_settings() {
    return this.get({
      path: 'account/settings',
    });
  }

  rate_limit(resources='statuses,users,search,help') {
    return this.get({
      path: 'application/rate_limit_status',
      params: {
        resources,
      }
    });
  }

  home(params) {
    return this.get({
      path: "statuses/home_timeline",
      params,
    })
  }

  timeline(params) {
    return this.get({
      path: "statuses/user_timeline",
      params,
    })
  }

  mentions(params) {
    return this.get({
      path: "statuses/mentions_timeline",
      params,
    })
  }

  tweet(params) {
    return this.post({
      path: 'statuses/update',
      params,
    });
  }

  image(params) {
    return this.upload({
      path: 'media/upload',
      params,
    });
  }

  retweet(id) {
    return this.post({
      path: `statuses/retweet/${id}`,
      tweet_mode: 'extended',
    });
  }

  favorite(id) {
    return this.post({
      path: `favorites/create/${id}`
    });
  }

  unfavorite(id) {
    return this.post({
      path: `favorites/destroy/${id}`
    });
  }

  messages(params) {
    return this.get({
      path: 'direct_messages/events/list',
      params,
    })
  }


  user(params) {
    return this.get({
      path: 'users/show',
      params,
    });
  }


  friendIds(params) {
    return this.get({
      path: '/friends/ids',
      params,
    })
  }

  followerIds(params) {
    return this.get({
      path: '/followers/ids',
      params,
    })
  }

  // helper function for friends/followers
  _profileList(opts) {
    const { path, data, screen_name, cursor, count } = opts;
    const _return = [];

    if (this._backoff.hasOwnProperty(path)) {
      return Promise.reject(data);
    }
    const config = {
      path: path,
      params: {
        skip_status: true,
        count: count || 10,
        cursor: cursor || -1,
        screen_name,
      },
    };
    return this.get(config);
  }

  friends(params) {
    params.path = 'friends/list';
    params.data = 'friends';
    console.log('friends params: ', params);
    return this._profileList(params);
  }

  followers(params) {
    params.path = 'followers/list';
    params.data = 'followers';
    return this._profileList(params);
  }

  search(params) {
    return this.get({
      path: 'search/tweets',
      params,
    })
  }

  users(params) {
    return this.get({
      path: "users/search",
      params,
    });
  }

  follow(screen_name) {
    return this.post({
      path: "friendships/create",
      params: {
        screen_name,
        follow: false,
      }
    });
  }

  unfollow(screen_name) {
    return this.post({
      path: "friendships/destroy",
      params: {
        screen_name,
      }
    });
  }

  block(screen_name) {
    return this.post({
      path: "blocks/create",
      params: {
        screen_name,
      },
    })
  }

  unblock(screen_name) {
    return this.post({
      path: "blocks/destroy",
      params: {
        screen_name,
      },
    })
  }

  friendships(screen_name) {
    return this.get({
      path: 'friendships/lookup',
      params: {
        screen_name,
      }
    })
  }

  trends(id=1,exclude=false) {
    return this.get({
      path: 'trends/place',
      params: {
        id,
        exclude,
      }
    });
  }

  show(id) {
    return this.get({
      path: 'statuses/show',
      params: {
        id,
        include_entities: true,
        trim_user: false,
        tweet_mode: 'extended',
      }
    })
  }

  lookup(id) {
    return this.get({
      path: 'statuses/lookup',
      params: {
        id,
        include_entities: true,
        trim_user: false,
        tweet_mode: 'extended',
      }
    })
  }

}


module.exports = TwitterServer;
