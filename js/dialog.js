
var _init = $.ui.dialog.prototype._init;
$.ui.dialog.prototype._init = function () {
    _init.apply(this, arguments);

    var dialog_element = this;
    var dialog_id = this.uiDialogTitlebar.next().attr('id');
    var prevPos = dialog_element.options.position;
    prevPos.my = 'left+0 top+0';
    prevPos.at = 'left top';
    this.uiDialogTitlebar.append('<a href="#" id="' + dialog_id +
        '-minbutton" class="ui-dialog-titlebar-minimize ui-corner-all">' +
        '<span class="ui-icon ui-icon-minusthick"></span></a>');

    $('#dialog_window_minimized_container').append(
        '<div class="dialog_window_minimized ui-widget ui-state-default ui-corner-all" id="' +
        dialog_id + '_minimized">' + this.uiDialogTitlebar.find('.ui-dialog-title').text() +
        '<span class="ui-icon ui-icon-newwin"></div>');

    $('#' + dialog_id + '-minbutton').hover(function () {
        $(this).addClass('ui-state-hover');
    }, function () {
        $(this).removeClass('ui-state-hover');
    }).click(function () {
        prevPos = dialog_element.options.position;
        // console.log(prevPos);
        dialog_element.close();
        $('#' + dialog_id + '_minimized').show();
    });

    $('#' + dialog_id + '_minimized').click(function () {
        $(this).hide();
        dialog_element.options.position = prevPos;
        // dialog_element.options.position.my= 'left+0 top+0';
        // dialog_element.options.position.at= 'left top';
        dialog_element.open();
    });
};
function create1(title,content) {
    var div_count = $('.dialog_window').length + 1;
    var div_id = 'dialog_window_' + div_count;
    var div_title =title;// $('#new_window_title').val();
    var div_content =content;// $('#new_window_content').val();
    var buttons = new Array();
    // if ($('#alertbutton').is(':checked')) {
    //     buttons.push({
    //         text: 'ALERT',
    //         click: function () {
    //             alert('ALERTING from Dialog Widnow: ' + div_title);
    //         }
    //     });
    // }

    // if ($('#closebutton').is(':checked')) {
    //     buttons.push({
    //         text: 'CLOSE',
    //         click: function () {
    //             $('#' + div_id).dialog('close');
    //         }
    //     });
    // }

    $('body').append('<div class="dialog_window" id="' + div_id + '">' + div_content + '</div>');

    var dialog = $('#' + div_id).dialog({
        width: 'auto',
        height: 'auto',
        title: div_title,
        autoOpen: true,
        buttons: buttons
    });
}
 
//<input type="button" value="Load">  <input type="button" value="Compile" onclick="compile()">
create1("Controller",$('#controller_html').html());
$('#controller_html').html('');

$('#' + 'dialog_window_2').dialog("widget").find(".ui-dialog-titlebar-close").hide();
$('#' + 'dialog_window_2').parent().css({ left: 0, top: 0 });
$('#new_window_title').val('');
$('#new_window_content').val('');