var H5PEditor = H5PEditor || {};

/**
 * Wizard editor widget module
 *
 * @param {jQuery} $
 */
H5PEditor.widgets.wizard = H5PEditor.Wizard = (function ($, EventDispatcher) {

  /**
   * Initialize wizard editor.
   *
   * @param {mixed} parent
   * @param {Object} field
   * @param {mixed} params
   * @param {function} setValue
   * @returns {_L8.C}
   */
  function C(parent, field, params, setValue) {
    var that = this;

    // Event support
    H5P.EventDispatcher.call(that);

    this.parent = parent;
    this.field = field;
    this.params = params;
    this.setValue = setValue;
    this.library = parent.library + '/' + field.name;
    this.children = [];

    this.passReadies = true;
    parent.ready(function () {
      that.passReadies = false;
    });
  }

  // Inheritance
  C.prototype = Object.create(EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Append field to wrapper.
   *
   * @param {jQuery} $wrapper
   * @returns {undefined}
   */
  C.prototype.appendTo = function ($wrapper) {
    var that = this;
    this.$item = $(this.createHtml()).appendTo($wrapper);
    this.$errors = this.$item.children('.h5p-errors');
    var $panesWrapper = $('<div class="h5peditor-panes"></div>').insertBefore(this.$errors);

    if (this.params === undefined) {
      this.params = {};
      this.setValue(this.field, this.params);
    }
    H5PEditor.processSemanticsChunk(this.field.fields, this.params, $panesWrapper, this);

    this.$panes = $panesWrapper.children();
    this.$tabs = this.$item.find('ol > li > a').click(function () {
      that.showTab($(this));
      return false;
    });

    this.$panes.children('.h5peditor-label').hide();

    var $navButtonsWrapper = $('<div class="h5peditor-wizard-navigation-buttons"></div>').appendTo(this.$item);
    
    var $prevButton = $('<div class="nav-button-prev" data-id="0"></div>')
      .append($('<span class="nav-button-icon"></span>'))
      .append($('<div/>')
        .append($('<span>' + C.t('previousStep') + '</span>'))
        .append($('<span class="nav-button-label">' + this.field.fields[0].label + '</span>')))
      .click(function () {
        var currentTabId = $(this).attr('data-id');
        that.showTab(that.$item.find('ol > li > a[data-id=' + currentTabId + ']'));
      }).appendTo($navButtonsWrapper)
        .hide();

    var $nextButton = $('<div class="nav-button-next" data-id="1"></div>')
      .append($('<div/>')
        .append($('<span>' + C.t('nextStep') + '</span>'))
        .append($('<span class="nav-button-label">' + this.field.fields[1].label + '</span>')))
      .append($('<span class="nav-button-icon"></span>'))
      .click(function () {
        var currentTabId = $(this).attr('data-id');
        that.showTab(that.$item.find('ol > li > a[data-id=' + currentTabId + ']'));
      }).appendTo($navButtonsWrapper);

    this.$tabs.eq(0).click();
  };

  /**
   * Update the wizard navigation icons
   */
  C.prototype.updateWizardIcons = function ($tab, id) {
    if (this.$tabs.length > 0) {
      if (parseInt(id) > 0) {
        var $prevTab = this.$tabs.eq(parseInt(id) - 1);
        this.$item.find('.nav-button-prev .nav-button-label')
          .attr('class', 'nav-button-label ' + $prevTab
            .attr('class').split(' ').find(function (className) {
              return (className.match(/h5peditor-tab-[a-zA-z]{2,}/i) !== null);
            })
          ).text($prevTab.find('.field-name').text());
      }
      if (parseInt(id) < this.$tabs.length - 1) {
        var $nextTab = this.$tabs.eq(parseInt(id) + 1);
        this.$item.find('.nav-button-next .nav-button-label')
          .attr('class', 'nav-button-label ' + $nextTab
            .attr('class').split(' ').find(function (className) {
              return (className.match(/h5peditor-tab-[a-zA-z]{2,}/i) !== null);
            })
          ).text($nextTab.find('.field-name').text());
      }
    }
  };

  /**
   * Create HTML for the field.
   */
  C.prototype.createHtml = function () {
    var tabs = '<ol class="h5peditor-tabs">';
    for (var i = 0; i < this.field.fields.length; i++) {
      var field = this.field.fields[i];
      tabs += C.createTab(i, field);
    }
    tabs += '</ol>';

    return H5PEditor.createFieldMarkup(this.field, tabs);
  };

  /**
   * Display tab.
   *
   * @param {jQuery} $tab
   * @returns {undefined}
   */
  C.prototype.showTab = function ($tab) {
    var id = $tab.attr('data-id');
    this.$panes.hide().eq(id).show();
    this.$tabs.removeClass('h5peditor-active');
    $tab.addClass('h5peditor-active');

    this.updateWizardIcons($tab, id);

    // Give the poor child a chance to handle tab switching.
    if (this.children[id].setActive !== undefined) {
      this.children[id].setActive();
    }

    this.trigger('stepChanged', {
      id: parseInt(id),
      name: this.field.fields[id].name
    });
  };

  /**
   * Validate the current field.
   *
   * @returns {Boolean}
   */
  C.prototype.validate = function () {
    for (var i = 0; i < this.children.length; i++) {
      if (!this.children[i].validate()) {
        return false;
      }
    }

    return true;
  };

  /**
   * Local translate function.
   *
   * @param {Atring} key
   * @param {Object} params
   * @returns {@exp;H5PEditor@call;t}
   */
  C.t = function (key, params) {
    return H5PEditor.t('H5PEditor.Wizard', key, params);
  };

  /**
   * Collect functions to execute once the tree is complete.
   *
   * @param {function} ready
   * @returns {undefined}
   */
  C.prototype.ready = function (ready) {
    if (this.passReadies) {
      this.parent.ready(ready);
    }
    else {
      this.readies.push(ready);
    }
  };

  /**
   * Remove this item.
   */
  C.prototype.remove = function () {
    H5PEditor.removeChildren(this.children);
    this.$item.remove();
  };

  /**
   * Create HTML for a tab.
   *
   * @param {type} id
   * @param {type} label
   * @returns {String}
   */
  C.createTab = function (id, field) {
    return '<li class="h5peditor-tab-li"><a href="#" class="h5peditor-tab-a h5peditor-tab-' + field.name.toLowerCase() + '" data-id="' + id + '">' +
      '<span>Step ' + (id + 1) + '</span>' +
      '<span class="field-name">' + field.label + '</span>' +
    '</a></li>';
  };
	
  return C;
})(H5P.jQuery, H5P.EventDispatcher);

// Default english translations
H5PEditor.language['H5PEditor.Wizard'] = {
  libraryStrings: {
    previousStep: 'Previous Step',
    nextStep: 'Next Step'
  }
};
