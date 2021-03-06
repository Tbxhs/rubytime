var Activities = {
  init: function() {
    // table listing
    if (!$("#activities_filter").blank()) {
      Activities._addOnFilterSubmit();
      $(".client_combo, .user_combo, .role_combo, .project_combo, .activity_type_combo").change(function() {
        Activities.onSelectChanged($(this));
      });
      $(".add_criterium").click(Activities.addCriterium);
      $(".remove_criterium").click(Activities.removeCriterium);
      Activities._updateIcons('client');
      Activities._updateIcons('project');
      Activities._updateIcons('activity_type');
      Activities._updateIcons('role');
      Activities._updateIcons('user');
      Activities._initActivitiesList();
      $(document).bind(EVENTS.activity_added, Activities._reloadList);
      $(document).bind(EVENTS.activity_updated, Activities._reloadList);
      $(document).bind(EVENTS.activity_deleted, Activities._reloadList);
    }
  
    // calendar
    if (!Activities._calendarContainer().blank()) {
      $(document).bind(EVENTS.activity_added, Activities._reloadCalendar);
      $(document).bind(EVENTS.activity_updated, Activities._reloadCalendar);
      $(document).bind(EVENTS.vacation_added, Activities._reloadCalendar);
      $(document).bind(EVENTS.vacation_removed, Activities._reloadCalendar);
      Activities._initUserAndProjectCombo();
      Activities._initCalendar();
      $(document).bind('tb:ajax_loaded', Activities._initActivitiesList);
    }
  },
  
  _deleteActivity: function(link) {
    var id = link.url().match(/\d+$/g)[0];
    var activities = $('#list_activity_' + id + ",#calendar_activity_" + id);
    if (confirm("Are you sure?")) {
      $.ajax({
        url: link.url(),
        type: "DELETE",
        beforeSend: function() {
          activities.disableLinks();
        },
        success: function() {
          $(document).trigger(EVENTS.activity_deleted, { id: id });
        },
        error: function(xhr) {
          activities.enableLinks();
          Application.errorFromXhr(xhr);
        }
      });
    }

    return false;
  },
  
  _reloadCalendar: function(e, memory) {
    var container = Activities._calendarContainer();
    var date = '?';
    if (memory) {
      matches = memory.date.match(/(\d{4})-(\d{2})-\d{2}/);
      date += 'year=' + matches[1] + '&month=' + matches[2];
    }
    container.load('/' + container.attr('id').replace(/_/g, '/') + date, Activities._initCalendar);
  },
  
  _reloadList: function(e) {
    $('#activities_filter form:first').submit();
  },
  
  _calendarContainer: function() {
    return $("div[id$=calendar][id^=users], div[id$=calendar][id^=projects]");
  },
  
  _addOnFilterSubmit: function() {
    $.validator.addMethod("laterThanDateFrom", function(dateToString) {
      var dateFromString = $("#search_criteria_date_from").val();
      if (dateFromString === '' || dateToString === '') {
        return true;
      } else {
        var dateFrom = $.datepicker.parseDate(window.rubytime_date_format, dateFromString);
        var dateTo = $.datepicker.parseDate(window.rubytime_date_format, dateToString);
        return (dateTo >= dateFrom);
      }
    }, "End date must be equal or later than start date");

    var form = $("#activities_filter form:first");
    form.validate({
      focusInvalid: false,
      rules: {
        "search_criteria[date_to]": 'laterThanDateFrom',
        "search_criteria[date_from]": 'laterThanDateFrom'
      },
      submitHandler: function() {
        $("#primary").load(form.url() + '?' + form.serialize(), null, function() {
          Activities._initActivitiesList();
        });
        return false;
      }
    });
  },
  
  _initActivitiesList: function() {
    // style the table
    $(".activities").zebra();
  
    // init details icon/link
    Application.initCommentsIcons();
  
    // init edit icon/link
    tb_init(".edit_activity_link");

    // init delete icon/link
    $(".activities .remove_activity_link").click(function() {
      var t = $(this);
      Activities._deleteActivity(t);
      return false;
    });
  
    // handle selection of all activities
    $(".activity_select_all").click(function() {
      var checked = this.checked;
      $(this).parents("table").find("td input.checkbox").each(function() {
        this.checked = checked;
      });
    });
  
    // handle unselection of all_activities when one of activities has been unselected
    $(".activities td input.checkbox").click(function() {
      if (!this.checked) {
        $(this).parents("table").find(".activity_select_all")[0].checked = false;
      }
    });

    // handle new invoice form submission
    $("#create_invoice_form").submit(function() {
      var checkedActivityIds = $(".activities td .checkbox:checked");

      if (checkedActivityIds.length === 0) {
        Application.error('You need to select activities for this invoice.');
        return false;
      }

      var indicator = new Indicator($('#create_invoice_button'));
      indicator.start(Indicator.TRANSPARENT_IMAGE_SRC);

      try {
        $.ajax({
          type: 'POST',
          url: $(this).url(),
          data: Activities._createInvoiceActivityParams(checkedActivityIds) + '&' + $(this).serialize(),
          success: function() {
            $("#activities_filter form:first").submit();
            Application.notice('Invoice has been created successfully');
            indicator.stop();
          },
          error: function(xhr) {
            indicator.stop();
            Application.errorFromXhr(xhr);
          }
        });
      } catch(e) {
        alert(e);
        indicator.stop();
      }
    
      return false;
    });

    // handle "add activities to existing invoice" form submission
    $("#update_invoice_button").click(function() {
      var checkedActivityIds = $(".activities td .checkbox:checked");

      if (checkedActivityIds.length === 0) {
        Application.error('You need to select activities for this invoice.');
        return false;
      }
    
      var invoiceId = $("#invoice_id").val();
      if (invoiceId == "") {
        Application.error('You need to select an invoice.');
        return false;
      }

      var params = Activities._createInvoiceActivityParams(checkedActivityIds);

      var indicator = new Indicator($('#update_invoice_button'));
      indicator.start(Indicator.TRANSPARENT_IMAGE_SRC);

      $.ajax({
        type: "PUT",
        url: "/invoices/" + invoiceId,
        data: params,
        success: function() {
          $("#activities_filter form:first").submit();
          Application.notice('Activities have been added to invoice successfully');
          indicator.stop();
        },
        error: function() {
          indicator.stop();
        }
      });
      
      return false;
    });
  
    tb_init($("#prev_day_link, #next_day_link"));
  },

  _createInvoiceActivityParams : function(ids) {
    return $.makeArray(ids.map(function(i, f) {
        return 'invoice['+f.name.replace('[]', '')+'][]='+f.value })).join('&');
  },
  
  _reloadSelects: function(url, group, feedback) {
    url += "?"+$("#activities_filter form").serialize();
    $.getJSON(url, function(json) {
      var options = '<option value="">All</option>';
      for (var i = 0; i < json.options.length; i++) {
        options += '<option value="' + json.options[i].id + '">' + json.options[i].name + '</option>';
      }
      $("p." + group + " select:not(:first)").remove();
      $("p." + group + " select").html(options);
      Activities._updateIcons(group);
      
      if (feedback) {
        feedback(json);
      }
    });
  },

  _reloadProjects: function() {
    Activities._reloadSelects('/projects/for_clients', 'project', function() {
      Activities._reloadActivityTypes();
    });
  },
  
  _reloadActivityTypes: function() {
    Activities._reloadSelects('/activity_types/for_projects', 'activity_type', function(json) {
      json.options.length > 0 ? $("p.activity_type").show() : $("p.activity_type").hide();
      
      var element = $("#activities_filter form input.include_activities_without_types").parent();
      json.projects_with_activities_without_types_selected ? element.show() : element.hide();
    });
  },
  
  _reloadUsers: function() {
    Activities._reloadSelects('/users/with_roles', 'user');
  },
  
  _reloadOtherCriteria: function(group) {
    if (group == "client") {
      Activities._reloadProjects();
    } else if (group == "project") {
      Activities._reloadActivityTypes();
    } else if (group == "role") {
      Activities._reloadUsers();
    }
  },

  _updateIcons: function(group) {
    var criteria = $("p." + group);
    var first_select = $("p." + group + " select:first");
    if (criteria.length == 1) {
      // single criteria of this kind
    
      if (first_select.val() == '') {
        // 'All' selected - hiding '+' button
        first_select.siblings('a.add_criterium').hide();
      } else {
        // particular item selected - showing '+' button
        first_select.siblings('a.add_criterium').show();
      }
    } else {
      // multiple criterias of this kind
    
      // hide '+' button at all selects
      $("p." + group + " a.add_criterium").hide();
      // show '-' button at all selects except first
      $("p." + group + " a.remove_criterium:not(:first)").show();

      if ((first_select.find('option').length - 1) > criteria.length){
        // show '+' button
        $("p." + group + " a.add_criterium:last").show();
      }
    }
  },

  _getUnselectedOptions: function(group, select) {
    var siblingSelects = select.parent().siblings("p." + group).find("select");
    var unselected = select.find("option").filter(function() {
      return siblingSelects.find("option:selected[value=" + $(this).val() + "]").length === 0;
    });
    return unselected;
  },
  
  onSelectChanged: function(select) {
    var currentParagraph = select.parents("p");
    var group = currentParagraph.attr("class");
    if (select.val() == '') { // "All" selected
      // remove additional criteria of the same kind
      currentParagraph.siblings("p." + group).remove();
    }
    Activities._reloadOtherCriteria(group);
    Activities._updateIcons(currentParagraph.attr("class"));
  },
  
  addCriterium: function() {
    var currentParagraph = $(this).parents("p");
    var group = currentParagraph.attr("class");
  
    // clone current paragraph to new (with events)
    var newParagraph = currentParagraph.clone(true);
  
    // remove blank 'All' option
    newParagraph.find("option[value='']").remove();
  
    var select = newParagraph.find("select");
    var label = newParagraph.find("label");
  
    // hide, insert into dom, select first unselected item and finally show
    newParagraph.hide().insertAfter(currentParagraph);
    var unselected = Activities._getUnselectedOptions(group, select);
    unselected.filter(":first").attr("selected", "selected");
    newParagraph.show();
  
    Activities._reloadOtherCriteria(group);
    Activities._updateIcons(group);

    return false;
  },
  
  removeCriterium: function() {
    var currentParagraph = $(this).parents("p");
    var group = currentParagraph.attr("class");
    currentParagraph.remove();
    Activities._reloadOtherCriteria(group);
    Activities._updateIcons(group);
  
    return false;
  },

  _initCalendar: function() {
    $("#previous_month, #next_month").click(function() {
      $("div[id$=calendar]").load($(this).url(), Activities._initCalendar);
      return false;
    });

    $(".add_activity").click(function() {
      var date = $(this).attr('id').match(/\d{4}-\d{2}-\d{2}/)[0];
      var user_id = Activities._calendarContainer().attr('id').match(/\d+/)[0];
      var memo = {
        date: date,
        user_id: user_id
      };
      $(document).trigger(EVENTS.add_activity_clicked, memo);
      return false;
    });

    $(".day_off").click(function() {
      var date = $(this).attr('id').match(/\d{4}-\d{2}-\d{2}/)[0];
      var user_id = Activities._calendarContainer().attr('id').match(/\d+/)[0];
      $.ajax({
        type: "POST",
        url: "/free_days",
        data: {
          date: date,
          user_id: user_id
        },
        success: function() {
          $(document).trigger(EVENTS.vacation_added);
        }
      });
      return false;
    });

    $(".working_day").click(function() {
      var date = $(this).attr('id').match(/\d{4}-\d{2}-\d{2}/)[0];
      var user_id = Activities._calendarContainer().attr('id').match(/\d+/)[0];
      $.ajax({
        type: "DELETE",
        url: "/free_days/delete",
        data: {
          date: date,
          user_id: user_id
        },
        success: function() {
          $(document).trigger(EVENTS.vacation_removed);
        }
      });
      return false;
    });

    $("td.day").mouseover(function() {
      $(this).find(".activity_icons").show();
    }).mouseout(function() {
      $(this).find(".activity_icons").hide();
    });

    tb_init($(".show_day, td li.more a"));
  },
  
  _initUserAndProjectCombo: function() {
    $("select#user_id").change(function() {
      var location = ('' + window.location);
      var currentId = location.match(/(\d+)\/calendar/)[1];
      var date = $('.date');
      var dateParams = "?year=" + date.attr('data-current-year') + "&month=" + date.attr('data-current-month');
      location = location.replace("/" + currentId + "/", "/" + $(this).val() + "/");
      var locationWithoutParams = location.replace(/\?.*/, '');
      window.location = locationWithoutParams + dateParams;
    });

    $("select#project_id").change(function() {
      var location = ('' + window.location);
      var currentId = location.match(/(\d+)\/calendar/)[1];
      window.location = location.replace("/" + currentId + "/", "/" + $(this).val() + "/");
    });
  }
};

$(Activities.init);
