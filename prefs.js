const { Gtk, GObject, Gio } = imports.gi;

const Me = imports.misc.extensionUtils.getCurrentExtension();

function init () {
}

//get settings from schemas file
function getSettings() {
    const GioSSS = Gio.SettingsSchemaSource;
    const schemaSource = GioSSS.new_from_directory(
        Me.dir.get_child('schemas').get_path(),
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

settings = getSettings();

//create widget as defined in PrefsWidget
function buildPrefsWidget () {
    const widget = new PrefsWidget();
    widget.show_all();
    return widget;
}

//widget class
const PrefsWidget = new GObject.Class({

    Name: 'Prefs.Widget',
    GTypeName: 'PrefsWidget',
    Extends: Gtk.ScrolledWindow,

    _init: function (params) {

        this.parent(params);

        //get content from glade generated ui
        const builder = new Gtk.Builder();
        builder.add_from_file(Me.path + '/prefs.ui');

        this.add( builder.get_object('main_prefs') );

        //set auth_switch to the the saved status
        const auth_Switch = builder.get_object('auth_switch');
        const display_auth = settings.get_boolean('display-auth');
        auth_Switch.set_active(display_auth);

        //set gdm_switch to the the saved status
        const gdm_Switch = builder.get_object('gdm_switch');
        const display_Gdm = settings.get_boolean('display-gdm');
        gdm_Switch.set_active(display_Gdm);

        //set tools_switch to the the saved status
        const tools_Switch = builder.get_object('tools_switch');
        const display_Tool = settings.get_boolean('display-tools');
        tools_Switch.set_active(display_Tool);

        //set functions for elements
        const SignalHandler = {

            //set status to userinput - (dont) show auth-options
            on_auth_switch_state_set (w) {
                log( 'YubIconPrefs: Authentication options switched to: ' + w.get_active() );
                settings.set_boolean('display-auth', w.get_active() );
            },

            //set status to userinput - (dont) show gdm-options
            on_gdm_switch_state_set (w) {
                log( 'YubIconPrefs: GDM options switched to: ' + w.get_active() );
                settings.set_boolean('display-gdm', w.get_active() );
            },

            //set status to userinput - (dont) show external tools
            on_tools_switch_state_set (w) {
                log( 'YubIconPrefs: External Tools options switched to: ' + w.get_active() );
                settings.set_boolean('display-tools', w.get_active() );
            },

        };
        //connect functions with elements
        builder.connect_signals_full( (builder, object, signal, handler) => {
            object.connect( signal, SignalHandler[handler].bind(this) );
        });

        }
});

