'use strict';
//TODO -> TABS TO 4-SPACE INDENTATION (JAVA STYLE)
const { St, Gio, GLib, GObject } = imports.gi;
const { main, panelMenu, popupMenu } = imports.ui;
const Lang = imports.lang;
const Util = imports.misc.util;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ExtensionPath = Me.dir.get_path();

let YubIconMenu = null;
let settings = getSettings();


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


function init() {
    log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);

    //TODO
    //Util.spawn([`${ExtensionPath}/Utils/init`]);
}

function enable() {
    //when enabling the extension print status and create the menu
    log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
    log (`${Me.metadata.name}: auth-state = ` + settings.get_boolean('auth-state').toString() );
    log (`${Me.metadata.name}: gdm-state = ` + settings.get_boolean('gdm-state').toString() );
    YubIconMenu = new YubIcon();
    main.panel.addToStatusArea('YubIconMenu', YubIconMenu, 1);
}

function disable() {
    //when disabling the extension print status again and remove the menu
    log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
    log (`${Me.metadata.name}: auth-state = ` + settings.get_boolean('auth-state').toString() );
    log (`${Me.metadata.name}: gdm-state = ` + settings.get_boolean('gdm-state').toString() );
    YubIconMenu.destroy();
    YubIconMenu = null;
}

const YubIcon = GObject.registerClass(
class YubIcon extends panelMenu.Button {

    _init () {
        //Objecttype
        super._init(0);

        //icon
        const icon = new St.Icon({
        gicon : Gio.icon_new_for_string(Me.dir.get_path() + '/img/icon.png'),
        style_class : 'system-status-icon',
        });
        this.add_child(icon);

        // pamd_sub menu //
        if((settings.get_boolean('display-auth') == true || settings.get_boolean('display-gdm') == true)) {
            const pamd_SubItem = new popupMenu.PopupSubMenuMenuItem('Pam.d Settings');
            this.menu.addMenuItem(pamd_SubItem);

            if(settings.get_boolean('display-auth') == true) {
                // Auth Options
                //Toggle Authentication Status
                const auth_Toggle = new popupMenu.PopupSwitchMenuItem('Auth', 'Auth');
                if(settings.get_boolean('auth-state') == false)
                auth_Toggle.setToggleState(false);
                auth_Toggle.connect('activate', Lang.bind(this, function() {
                    Util.spawn.commandLine(`${ExtensionPath}/Utils/YubIcon_trigger auth_switch`);
                    const state = getAuthState();
                    setAuthState(!state);
                }));
                pamd_SubItem.menu.addMenuItem(auth_Toggle , 0 );

                //Set method sufficient
                const auth_Sufficient_Item = menu_Item('Auth: Sufficient', 'auth_suf');
                pamd_SubItem.menu.addMenuItem(auth_Sufficient_Item , 1 );

                //Set method required
                const auth_Required_Item = menu_Item('Auth: Required', 'auth_req');
                pamd_SubItem.menu.addMenuItem(auth_Required_Item , 2 );
            }

            //GDM Options
            //Toggle authentication status
            if(settings.get_boolean('display-gdm') == true) {
                const gdm_Toggle =  new popupMenu.PopupSwitchMenuItem('GDM','GDM');
                if(settings.get_boolean('gdm-state') == false)
                    gdm_Toggle.setToggleState(false);
                    gdm_Toggle.connect('activate', Lang.bind(this, function() {
                        Util.spawnCommandLine(`${ExtensionPath}/Utils/YubIcon_trigger gdm_switch`);
                        const state = getGdmState();
                        setGdmState(!state);
                    }));
                    pamd_SubItem.menu.addMenuItem(gdm_Toggle , 3 );

                    //set method sufficient
                    const gdm_Sufficient_Item = menu_Item('gdm: Sufficient', 'gdm_suf');
                    pamd_SubItem.menu.addMenuItem(gdm_Sufficient_Item , 4 );

                    //set method required
                    const gdm_Required_Item = menu_Item('gdm: Required', 'gdm_req');
                    pamd_SubItem.menu.addMenuItem(gdm_Required_Item , 5 );
                }
            }

        // tools_sub menu //
        if(settings.get_boolean('display-tools') == true) {
            const tools_SubItem = new popupMenu.PopupSubMenuMenuItem('Launch Tools');
            var tool_exists = false;

            //yubikey personalizer
            var [ok, out, err, exit] = GLib.spawn_command_line_sync('/bin/bash -c "which yubikey-personalization-gui | grep /"');
            if(out.length > 0) {
                const Yubikey_Personalization_Item = menu_Ext('Yubikey Personalizer', 'yubikey-personalization-gui');
                tools_SubItem.menu.addMenuItem(Yubikey_Personalization_Item, 0 );
                tool_exists = true;
            }

            //yubikey authenticator
            var [ok, out, err, exit] = GLib.spawn_command_line_sync('/bin/bash -c "which yubioath-desktop | grep /"');
            if(out.length > 0) {
                const Yubico_Authenticator_Item = menu_Ext('Yubico Authenticator', 'yubioath-desktop');
                tools_SubItem.menu.addMenuItem(Yubico_Authenticator_Item, 1 );
                tool_exists = true;
            }

            //keepassxc
            var [ok, out, err, exit] = GLib.spawn_command_line_sync('/bin/bash -c "which keepassxc | grep /"');
            if(out.length > 0) {
                const Keepassxc_Item = menu_Ext('KeePassXC', 'keepassxc');
                tools_SubItem.menu.addMenuItem(Keepassxc_Item, 2 );
                tool_exists = true;
            }

            if(tool_exists){
            this.menu.addMenuItem(tools_SubItem);
            }
        }

    const options_Item = new popupMenu.PopupMenuItem('Show Menu');
    options_Item.connect('activate', Lang.bind(this, function() {
        Util.spawnCommandLine('/bin/bash -c "gnome-extensions prefs YubIcon@FriendOfTux"');
    }));
    this.menu.addMenuItem(options_Item);

    }

});

//return menuitem with label and shell-command
function menu_Item(text, command) {
    const item = new popupMenu.PopupMenuItem(`${text}`);
    item.connect('activate', Lang.bind(this, function() {
        Util.spawnCommandLine(`notify-send ${ExtensionPath}/Utils/YubIcon_trigger ${command}`);
        Util.spawnCommandLine(`${ExtensionPath}/Utils/YubIcon_trigger ${command}`);
    }));
    return item;
}
//get status of switches
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
//set status of switches
function setAuthState(state) {
    log ('Setting auth-state to:' + state);
    settings.set_boolean('auth-state', state);
}
function setGdmState(state) {
    log ('Setting gdm-state to:' + state);
    settings.set_boolean('gdm-state', state);
}

//return menuitem with label/icon that calls external tool
function menu_Ext(text, command) {
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
