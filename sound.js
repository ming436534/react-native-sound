'use strict';

import { Platform } from 'react-native';

var RNSound = require('react-native').NativeModules.RNSound;
var IsAndroid = RNSound.IsAndroid;
var resolveAssetSource = require("react-native/Libraries/Image/resolveAssetSource");
var nextKey = 0;


function isRelativePath(path) {
  return !/^\//.test(path);
}
function Sound(filename, basePath, onError) {
  var asset = resolveAssetSource(filename);
  if (asset) {
    this._filename = asset.uri;
    onError = basePath;
  } else {
    this._filename = basePath ? basePath + '/' + filename : filename;

    if (IsAndroid && !basePath && isRelativePath(filename)) {
      this._filename = filename.toLowerCase().replace(/\.[^.]+$/, '');
    }
  }
  this._onError = onError;
  this._loaded = false;
  this._key = nextKey++;
  this._duration = -1;
  this._numberOfChannels = -1;
  this._volume = 1;
  this._pan = 0;
  this._numberOfLoops = 0;
}

Sound.prototype.prepare = function() {
  var onError = (error, props) => {
    if (props) {
      if (typeof props.duration === 'number') {
        this._duration = props.duration;
      }
      if (typeof props.numberOfChannels === 'number') {
        this._numberOfChannels = props.numberOfChannels;
      }
    }
    if (error === null) {
      this._loaded = true;
    }
    this._onError && this._onError(error);
  }

  if (Platform.OS === 'ios') {
    RNSound.prepare(this._filename, this._key, onError);
  } else {
    RNSound.prepare(this._filename, this._key, this._streamType, onError);
  }
}

Sound.prototype.setAudioStreamType = function(streamType) {
  if (Platform.OS === 'android' && this._streamType != streamType) {
    if (this._loaded) {
      RNSound.release();
      this._loaded = false;
      RNSound.prepare(this._filename, this._key, streamType, (error, props) => {
        if (error === null) {
          this._loaded = true;
        } else {
          onError && onError(error);
        }
      });
    } else {
      this._streamType = streamType;
    }
  } else {
    throw 'this function is android only';
  }
  return this;
}


Sound.prototype.isLoaded = function() {
  return this._loaded;
};

Sound.prototype.play = function(onEnd) {
  if (this._loaded) {
    RNSound.play(this._key, (successfully) => onEnd && onEnd(successfully));
  }
  return this;
};

Sound.prototype.pause = function() {
  if (this._loaded) {
    RNSound.pause(this._key);
  }
  return this;
};

Sound.prototype.stop = function() {
  if (this._loaded) {
    RNSound.stop(this._key);
  }
  return this;
};

Sound.prototype.release = function() {
  if (this._loaded) {
    RNSound.release(this._key);
  }
  return this;
};

Sound.prototype.getDuration = function() {
  return this._duration;
};

Sound.prototype.getNumberOfChannels = function() {
  return this._numberOfChannels;
};

Sound.prototype.getVolume = function() {
  return this._volume;
};

Sound.prototype.setVolume = function(value) {
  this._volume = value;
  if (this._loaded) {
    if (IsAndroid) {
      RNSound.setVolume(this._key, value, value);
    } else {
      RNSound.setVolume(this._key, value);
    }
  }
  return this;
};

Sound.prototype.getPan = function() {
  return this._pan;
};

Sound.prototype.setPan = function(value) {
  if (this._loaded) {
    RNSound.setPan(this._key, this._pan = value);
  }
  return this;
};

Sound.prototype.getNumberOfLoops = function() {
  return this._numberOfLoops;
};

Sound.prototype.setNumberOfLoops = function(value) {
  this._numberOfLoops = value;
  if (this._loaded) {
    if (IsAndroid) {
      RNSound.setLooping(this._key, !!value);
    } else {
      RNSound.setNumberOfLoops(this._key, value);
    }
  }
  return this;
};

Sound.prototype.getCurrentTime = function(callback) {
  if (this._loaded) {
    RNSound.getCurrentTime(this._key, callback);
  }
};

Sound.prototype.setCurrentTime = function(value) {
  if (this._loaded) {
    RNSound.setCurrentTime(this._key, value);
  }
  return this;
};

// ios only
Sound.prototype.setCategory = function(value) {
  RNSound.setCategory(this._key, value);
};

Sound.enable = function(enabled) {
  RNSound.enable(enabled);
};

Sound.enableInSilenceMode = function(enabled) {
  if (!IsAndroid) {
    RNSound.enableInSilenceMode(enabled);
  }
};

if (!IsAndroid) {
  Sound.enable(true);
}

Sound.MAIN_BUNDLE = RNSound.MainBundlePath;
Sound.DOCUMENT = RNSound.NSDocumentDirectory;
Sound.LIBRARY = RNSound.NSLibraryDirectory;
Sound.CACHES = RNSound.NSCachesDirectory;

Sound.STREAM_TYPE = {};
Sound.STREAM_TYPE.STREAM_ALARM = RNSound.STREAM_ALARM;
Sound.STREAM_TYPE.STREAM_DTMF = RNSound.STREAM_DTMF;
Sound.STREAM_TYPE.STREAM_MUSIC = RNSound.STREAM_MUSIC;
Sound.STREAM_TYPE.STREAM_NOTIFICATION = RNSound.STREAM_NOTIFICATION;
Sound.STREAM_TYPE.STREAM_RING = RNSound.STREAM_RING;
Sound.STREAM_TYPE.STREAM_SYSTEM = RNSound.STREAM_SYSTEM;
Sound.STREAM_TYPE.STREAM_VOICE_CALL = RNSound.STREAM_VOICE_CALL;
Sound.STREAM_TYPE.USE_DEFAULT_STREAM_TYPE = RNSound.USE_DEFAULT_STREAM_TYPE;


module.exports = Sound;