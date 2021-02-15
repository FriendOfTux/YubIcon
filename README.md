# YubIcon
Gnome Shell Extension for Yubico's Yubikey

This is a project I made for fun, so it is not perfect. \
I'm not a JS developer so you will certainly find some flaws.

With YubIcon you can change the configuration in /etc/pam.d \
to "required" or "sufficient" so that you may use a YubiKey \
to authenticate. The files I used are "system-auth" on Arch, \
"common-auth" on Debian and "gdm-password". \
The extension also allows you to launch "KeePassXC", "Yubico Authenticator" \
and the "Yubikey Personalization Tool" if one of them is installed.

![YubIcon.png](https://raw.githubusercontent.com/FriendOfTux/YubIcon/main/img/extension.png)

BUGS: 

Login in with a YubiKey does not unlock the Gnome-Keyring, \
so the feature does not really make sense if "gdm-password" is \
set to "sufficient". This is not caused by the extension, \
it's caused by the way the Keyring is unlocked.


You can hide Sub-menus in the extensions' configuration, \
but the menu will not reload until you reload the \
Gnome shell -> no need to fix this for now


SETUP \
// YubiKey SETUP -> ENABLES YUBIKEY FOR PAM MODULES \
setup/setup-key.sh

SCRIPTS \
// JAVASCRIPT EXTENSION \
extension.js \
prefs.js \
// SCRIPT TO ACTIVATE NEXT SCRIPT WITH ROOT PRIVILEGES \
scripts/YubIcon_trigger \
// SCRIPT TO MODIFY THE FILES NEEDED FOR YubIcon \
scripts/YubIcon

RESSOURCES\
https://developers.yubico.com/yubico-pam/ or https://github.com/Yubico/yubico-pam \
https://wiki.archlinux.org/index.php/Yubikey \
https://support.yubico.com/hc/en-us/articles/360016649099-Ubuntu-Linux-Login-Guide-U2F
