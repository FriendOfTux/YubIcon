'use strict';
const { St, Gio, GLib, GObject } = imports.gi;
const { main, panelMenu, popupMenu } = imports.ui;
const Lang = imports.lang;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ExtensionPath = Me.dir.get_path();

//global variables

let indicator = null;
let settings = getSettings();
let timeout;

let auth_SubItem = new popupMenu.PopupSubMenuMenuItem('Auth Settings');
let gdm_SubItem = new popupMenu.PopupSubMenuMenuItem('GDM Settings');
let tools_SubItem = new popupMenu.PopupSubMenuMenuItem('Launch Tools');
let tool_exists = false;

//import settings from schema
function getSettings() {
    const GioSSS = Gio.SettingsSchemaSource;
    const schemaSource = GioSSS.new_from_directory(
        Me.dir.get_child("schemas").get_path(),
        GioSSS.get_default(),
        false
    );
    const schemaObj = schemaSource.lookup(
    'org.gnome.shell.extensions.YubIcon', true);
    if (!schemaObj) {
        throw new Error('cannot find schemas');
    }
    return new Gio.Settings({ settings_schema : schemaObj });
}

//status change "memory"
let display_auth, display_gdm, display_tools;
let old_display_auth = true, old_display_gdm = true, old_display_tools = true;

//mainloop function - add or remove menuitems
function setMenuItems() {

    display_auth = settings.get_boolean('display-auth');
    display_gdm = settings.get_boolean('display-gdm');
    display_tools = settings.get_boolean('display-tools');

    if (display_auth != old_display_auth && display_auth) {
        createAuthMenu();
    }

    if (display_gdm != old_display_gdm && display_gdm) {
        createGdmMenu();
    }

    if (display_tools != old_display_tools && display_tools) {
        createToolsMenu();
    }

    if (display_auth != old_display_auth && !display_auth) {
        auth_SubItem.destroy();
        auth_SubItem = null;
        auth_SubItem = new popupMenu.PopupSubMenuMenuItem('Auth Settings');
    }

    if (display_gdm != old_display_gdm && !display_gdm) {
        gdm_SubItem.destroy();
        gdm_SubItem = null;
        gdm_SubItem = new popupMenu.PopupSubMenuMenuItem('GDM Settings');
    }

    if (display_tools != old_display_tools && !display_tools) {
        tools_SubItem.destroy();
        tools_SubItem = null;
        tools_SubItem = new popupMenu.PopupSubMenuMenuItem('Launch Tools');
    }

    old_display_auth = display_auth;
    old_display_gdm = display_gdm;
    old_display_tools = display_tools;

    return true;
}


function init() {
    //on initalizing the extension ...
    log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);

    //TODO Util.spawn([`${ExtensionPath}/Utils/init`]);
    //TODO
}

function enable() {
    //on enabling the extension print status and create the menu
    log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
    log (`${Me.metadata.name}: auth-state = ` + settings.get_boolean('auth-state').toString() );
    log (`${Me.metadata.name}: gdm-state = ` + settings.get_boolean('gdm-state').toString() );
    indicator = new YubIcon();
    main.panel.addToStatusArea('YubIconMenu', indicator, 1);
    timeout = Mainloop.timeout_add_seconds(1.0, setMenuItems);
}

function disable() {
    //on disabling the extension print status and remove the menu
    log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
    log (`${Me.metadata.name}: auth-state = ` + settings.get_boolean('auth-state').toString() );
    log (`${Me.metadata.name}: gdm-state = ` + settings.get_boolean('gdm-state').toString() );
    Mainloop.source_remove(timeout);
    indicator.destroy();
    indicator = null;
}

const YubIcon = GObject.registerClass(
class YubIcon extends panelMenu.Button {

    _init () {
        super._init(0);

        //icon
        const icon = new St.Icon({
        gicon : Gio.icon_new_for_string(Me.dir.get_path() + '/img/icon.png'),
        style_class : 'system-status-icon',
        });
        this.add_child(icon);

        // Auth Options //
        if(settings.get_boolean('display-auth')) {
            createAuthMenu();
            this.menu.addMenuItem(auth_SubItem, 0);
        }

        // GDM Options //
        if(settings.get_boolean('display-gdm')) {
            createGdmMenu();
            this.menu.addMenuItem(gdm_SubItem, 1);
        }

        // tools_sub menu //
        if(settings.get_boolean('display-tools')) {
            createToolsMenu();
            if(tool_exists){
                this.menu.addMenuItem(tools_SubItem, 2);
            }
        }

        /*
        // Helps the developer
        // Options Menu //
        const options_Item = new popupMenu.PopupMenuItem('Show Menu');
        options_Item.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine('/bin/bash -c "gnome-extensions prefs YubIcon@FriendOfTux"');
        }));
        this.menu.addMenuItem(options_Item, 3);
        */
    }

});

//create the menu for editing /etc/pam.d/*-auth
function createAuthMenu(){
    //Switch Item to un/comment the line in the config file
    const auth_Toggle = new popupMenu.PopupSwitchMenuItem('Auth', 'Auth');
    //Set the State of the Item based on the state of the config file
    //then connect the item to its function
    if(!settings.get_boolean('auth-state'))
        auth_Toggle.setToggleState(false);
        auth_Toggle.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine(`${ExtensionPath}/Utils/YubIcon_trigger auth_switch`);
            const state = getAuthState();
            setAuthState(!state);
        }));
    auth_SubItem.menu.addMenuItem(auth_Toggle , 0 );

    //Set method sufficient
    const auth_Sufficient_Item = spawnMenuItem('Auth: Sufficient', 'auth_suf');
    auth_SubItem.menu.addMenuItem(auth_Sufficient_Item , 1 );

    //Set method required
    const auth_Required_Item = spawnMenuItem('Auth: Required', 'auth_req');
    auth_SubItem.menu.addMenuItem(auth_Required_Item , 2 );

    if(indicator != null)
        indicator.menu.addMenuItem(auth_SubItem, 0);
}


//create the menu for editing /etc/pam.d/gdm-password
function createGdmMenu(){
    //Switch Item to un/comment the line in the config file
    const gdm_Toggle =  new popupMenu.PopupSwitchMenuItem('GDM','GDM');
    //Set the State of the Item based on the state of the config file
    //then connect the item to its function
    if(!settings.get_boolean('gdm-state'))
        gdm_Toggle.setToggleState(false);
        gdm_Toggle.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine(`${ExtensionPath}/Utils/YubIcon_trigger gdm_switch`);
            const state = getGdmState();
            setGdmState(!state);
        }));
        gdm_SubItem.menu.addMenuItem(gdm_Toggle , 3 );

    //set method sufficient
    const gdm_Sufficient_Item = spawnMenuItem('gdm: Sufficient', 'gdm_suf');
    gdm_SubItem.menu.addMenuItem(gdm_Sufficient_Item , 4 );

    //set method required
    const gdm_Required_Item = spawnMenuItem('gdm: Required', 'gdm_req');
    gdm_SubItem.menu.addMenuItem(gdm_Required_Item , 5 );

    if(indicator != null)
        indicator.menu.addMenuItem(gdm_SubItem, 1);
}

//create the menu for launching external tools
function createToolsMenu(){
    //yubikey personalizer
    var [ok, out, err, exit] = GLib.spawn_command_line_sync('/bin/bash -c "which yubikey-personalization-gui | grep /"');
    if(out.length > 0) {
        const Yubikey_Personalization_Item = spawnMenuExtItem('Yubikey Personalizer', 'yubikey-personalization-gui');
        tools_SubItem.menu.addMenuItem(Yubikey_Personalization_Item, 0 );
        tool_exists = true;
    }

    //yubikey authenticator
    var [ok, out, err, exit] = GLib.spawn_command_line_sync('/bin/bash -c "which yubioath-desktop | grep /"');
    if(out.length > 0) {
        const Yubico_Authenticator_Item = spawnMenuExtItem('Yubico Authenticator', 'yubioath-desktop');
        tools_SubItem.menu.addMenuItem(Yubico_Authenticator_Item, 1 );
        tool_exists = true;
    }

    //keepassxc
    var [ok, out, err, exit] = GLib.spawn_command_line_sync('/bin/bash -c "which keepassxc | grep /"');
    if(out.length > 0) {
        const Keepassxc_Item = spawnMenuExtItem('KeePassXC', 'keepassxc');
        tools_SubItem.menu.addMenuItem(Keepassxc_Item, 2 );
        tool_exists = true;
    }
    if(indicator != null && tool_exists)
            indicator.menu.addMenuItem(tools_SubItem, 2);
}

//return menuitem with label and shell-command
function spawnMenuItem(text, command) {
    const item = new popupMenu.PopupMenuItem(`${text}`);
    item.connect('activate', Lang.bind(this, function() {
        Util.spawnCommandLine(`notify-send ${ExtensionPath}/Utils/YubIcon_trigger ${command}`);
        Util.spawnCommandLine(`${ExtensionPath}/Utils/YubIcon_trigger ${command}`);
    }));
    return item;
}

//get status of switch items
function getAuthState() {
    const state = settings.get_boolean('auth-state');
    log ('auth-state is:' + state.toString());
    return state;
}

function getGdmState() {
    const state = settings.get_boolean('gdm-state');
    log ('gdm-state is:' + state.toString());
    return state;
}

//set status of switch items
function setAuthState(state) {
    log ('Setting auth-state to:' + state);
    settings.set_boolean('auth-state', state);
}

function setGdmState(state) {
    log ('Setting gdm-state to:' + state);
    settings.set_boolean('gdm-state', state);
}

//return menuitem with label/icon that calls external tool
function spawnMenuExtItem(text, command) {
    const item = new popupMenu.PopupMenuItem('');
    const item_label = new St.Label({
        text: `${text}`,
        x_expand: true
    });
    const item_Widget = new St.BoxLayout({x_expand: true});
    item_Widget.add(item_label);
    item_Widget.add(new St.Icon({
        icon_name: "go-next-symbolic",
        icon_size: 16
    }));

    item.add_child(item_Widget);
    item.connect('activate', Lang.bind(this, function(){
        Util.spawn([`${command}`]);
    }));
    return item;
}
