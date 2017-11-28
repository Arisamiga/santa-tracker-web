/*
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
'use strict';

goog.provide('app.view.CardsView');

goog.require('app.Constants');
goog.require('app.SVGUtils');
goog.require('app.HandwritingAPI');
goog.require('app.GameAPI');
goog.require('app.Utils');
goog.require('app.EventEmitter');


app.view.CardsView = function(container) {
  app.EventEmitter.call(this);

  this.handwritingAPI = new app.HandwritingAPI();
  this.gameAPI = new app.GameAPI();

  this.container = container;
  this.newround_card = container.find('.newround-card');
  this.timesup_card = container.find('.timesup-card');
  this.round_detail_card = container.find('.rounddetails-card');
  this.newround_card.hide();
  this.timesup_card.hide();
  this.round_detail_card.hide();
};


app.view.CardsView.prototype = Object.create(app.EventEmitter.prototype);


app.view.CardsView.prototype.showCard = function(card, cb) {
  card.isVisible = true;
  card.show({
    duration:0,
    complete: function() {
        card.addClass('visible');
        if (cb) {
          cb()
        }
    }
  });
};


app.view.CardsView.prototype.hideCard = function(card, cb) {
  card.isVisible = false;
  if (card.hasClass('visible')) {
    card.removeClass('visible');
    setTimeout(function() {
      card.hide();
      if(cb) {
        cb();
      }
    }.bind(this), 1000);
  }
};

app.view.CardsView.prototype.showNewRoundCard = function(options) {
  this.showCard(this.newround_card);

  this.newround_card.find('.slate__big-text').text(app.Utils.capitalize(options.word));
  this.newround_card.find('.newround-card__current-round').text(options.level);
  this.newround_card.find('.newround-card__total-rounds').text(app.Constants.TOTAL_LEVELS);

  var _callback = function() {
    if (options.onCardDismiss) {
      options.onCardDismiss();
    }
    this.hideCard(this.newround_card);
  }.bind(this);

  setTimeout(function() {
    this.newround_card
      .find('.newround-card__button')
      .on('touchend mouseup',function() {
        this.newround_card.off('touchend mouseup');
        _callback();
      }.bind(this));
  }.bind(this), 1000);
};


app.view.CardsView.prototype.showTimesUpCard = function(rounds, callback) {
  this.hideCard(this.newround_card);
  this.showCard(this.timesup_card);

  var roundsRecognized = rounds.filter(function(r) {
    return r.recognized == true
  }).length;

  var $titleElem = this.timesup_card.find('.timesup-card__title');
  var $sublineElem = this.timesup_card.find('.timesup-card__subline');
  var $drawingsWrapper = this.timesup_card.find('.timesup-card__drawings');
  $drawingsWrapper.html('');

  if (roundsRecognized == 0) {
    $titleElem.text(app.Utils.getTranslation(this.container, 'quickdraw-timesup-title-noguess'));
    $sublineElem.text(app.Utils.getTranslation(this.container, 'quickdraw-timesup-subline-noguess'));
  } else {
    $titleElem.text(app.Utils.getTranslation(this.container, 'quickdraw-timesup-title-guess'));
    $sublineElem.text(app.Utils.getTranslation(this.container, 'quickdraw-timesup-subline-guess', 'roundsRecognized', roundsRecognized));
  }

  // GET WIDHT AND HEIGHT
  var modelElem = $('<div>')
  .addClass('timesup-card__drawing');
  $drawingsWrapper.append(modelElem);
  var modelWidth = modelElem.width();
  var modelHeight = modelElem.height();
  modelElem.remove();

  rounds.forEach(function(round) {
    $drawingsWrapper.append(this.createDrawingElem(round, modelWidth, modelHeight));
  }.bind(this));

  this.timesup_card
    .find('.timesup-card__button')
    .off('touchend mouseup')
    .on('touchend mouseup', function() {
      if (callback) {
          callback('NEW_GAME');
      }
      this.hideCard(this.timesup_card);
    }.bind(this));
};


app.view.CardsView.prototype.createDrawingElem = function(round, width, height) {
  var drawingElem = $('<div>')
    .addClass('timesup-card__drawing');

  if (round.recognized) {
    drawingElem.addClass('timesup-card__drawing--recognized');
  } else {
    drawingElem.addClass('timesup-card__drawing--not-recognized');
  }

  var svgElem = app.SVGUtils.createSvgFromSegments(round.drawing, width, height, {padding: 10});
  drawingElem.append(svgElem);

  drawingElem.on('touchend mouseup', function() {
    this.showRoundDetailsCard(round);
  }.bind(this));

  return drawingElem;
};


app.view.CardsView.prototype.showRoundDetailsCard = function(round) {
  this.showCard(this.round_detail_card);

  //Section 1
  this.round_detail_card
    .find('.rounddetails-card__title')
    .text(app.Utils.getTranslation(this.container, 'quickdraw-rounddetails-title', 'word', round.word));
  var drawingElem = this.round_detail_card.find('.rounddetails-card__drawing--user');
  var svg = app.SVGUtils.createSvgFromSegments(round.drawing, drawingElem.width(), drawingElem.width() * 0.736, {padding: 25, color: 'rgba(0,0,0,1.00)'});
  drawingElem.html('');
  drawingElem.append(svg);

  //Section 2
  this.round_detail_card
  .find('.rounddetails-card__santa-title')
  .text(app.Utils.getTranslation(this.container, 'quickdraw-rounddetails-santa-version', 'word', round.word));
  var santaElem = this.round_detail_card.find('.rounddetails-card__drawing--santa');
  santaElem.css('background-image', "url('img/santas-" + round.word + ".svg')");

  //Section 3
  if (round.recognized) {
    this.round_detail_card.find('.rounddetails-card__similar-drawings-title--not-recognized').hide();
    this.round_detail_card.find('.rounddetails-card__similar-drawings-title--recognized').show();
  } else {
    this.round_detail_card.find('.rounddetails-card__similar-drawings-title--recognized').hide();
    this.round_detail_card.find('.rounddetails-card__similar-drawings-title--not-recognized').show();
  }
  this.fetchAndShowDrawingNeighbors(round);

  //Section 4
  // - NEED ACCESS TO API
  //this.gameAPI.fetchGallery(round.word);

  this.round_detail_card
    .find('.rounddetails-card__back-btn')
    .off('touchend mouseup')
    .on('touchend mouseup', function() {
      this.hideCard(this.round_detail_card);
    }.bind(this));
};


app.view.CardsView.prototype.fetchAndShowDrawingNeighbors = function(round) {
  var neighborElems = this.round_detail_card.find('.rounddetails-card__similar-drawing');
  if (round.drawing && round.drawing.length > 0) {
    this.handwritingAPI.getSimilarDrawings(round.drawing, round.width, round.height)
    .fail(function(jqXHR, textStatus, errorThrown) {
      console.error(jqXHR, textStatus, errorThrown);
    })
    .done(function(data) {
      if(data[0] == "SUCCESS") {
        var data = this.handwritingAPI.parseResponse(data);
        var neighbors = data.filter(function(d) {
          return d.neighbor;
        });

        neighbors = neighbors.filter(function(neighbor) {
          return neighbor.word != round.word;
        });

        neighbors = neighbors.slice(0, 3);

        // Loop over the three neighbors
        for (var i = 0; i < 3; i++) {
          if (neighbors.length > i) {
            var elem = $(neighborElems[i]);
            elem.show();

            // Set Text
            var textElem = elem.find('p');
            textElem.text(neighbors[i].word);

            // Set Reference Element
            var referenceElem = elem.find('.rounddetails-card__similar-drawing-reference');
            referenceElem.html('');
            var svgReference = app.SVGUtils.createSvgFromSegments(round.drawing, elem.width(), elem.width() * 0.736, {padding: 10, color: "rgba(0,0,0,0.15)"});
            referenceElem.append(svgReference);

            // Set Neighbor Element
            var neighborElem = elem.find('.rounddetails-card__similar-drawing-neighbor');
            neighborElem.html('');
            var svgNeighbor = app.SVGUtils.createSvgFromSegments(neighbors[i].neighbor, elem.width(), elem.width() * 0.736, {padding: 10, order: 1});
            neighborElem.append(svgNeighbor);

          } else {
            $(neighborElems[i]).hide();
          }
        } //ENDFOR
      }
    }.bind(this));
  } else {
    neighborElems.hide();
  }
};
