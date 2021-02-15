#./depends
#catch errors and ask how to handle
trap 'echo -e "\033[0;31m ######AN ERROR OCCURED####### \033[0m" ; echo "Stop? (y)" ; read in ; [ $in == "y" ] && exit -1' ERR

Yubikey_Setup() {

echo -e "\033[0;31mplease use exactly as intended and open another root terminal just in case anything goes wrong \033[0m"
echo -e "\033[0;31m   !the setup overwrites any existing configuration on the slot of the key which is needed!  \033[0m"

echo " -> installing tools needed for congiuration"
sleep 1
sudo apt install yubikey-personalization libpam-yubico

echo " -> overwriting second configuration"
echo " -> please insert the key! Then press Enter"
read any
sleep 1
ykpersonalize -2 -ochal-resp -ochal-hmac -ohmac-lt64 -oserial-api-visible

echo " -> creating directory for key"
sleep 1
mkdir ~/.yubico
cd ~/.yubico
echo "creating key"
sleep 1
ykpamcfg -2 -v

echo " -> getting token id"
sleep 1
echo " -> now please open another terminal and touch the key"
echo " -> and safe the output to ~/ykid like this echo !! > ~/ykid"
echo " -> then press any key"
read any
cd ~
id=$(cat ~/ykid | head -c 12)

echo $USER:$id > ~/.yubico/authorized_yubikeys

echo " -> now please insert this into the pam modules (sudo / su needed, not scriptable)"
echo "auth sufficient pam_yubico.so mode=challenge-response authfile=/home/$USER/.yubico/yubikey_mappings TO THE BOTTOM OF /etc/pam.d/gdm-password"
echo "auth sufficient pam_yubico.so mode=challenge-response authfile=/home/$USER/.yubico/yubikey_mappings TO THE TOP OF /etc/pam.d/common-auth"
}

#check if this setup is needed
echo "do you need to setup the yubikey for pam ( first time ? )"
OPTIONS="yes no"
select opt in $OPTIONS; do
	if [ "$opt" = "yes" ]; then
		Yubikey_Setup
		cd ..
		glib-compile-schemas schemas
		exit
	elif [ "$opt" = "no" ]; then
		echo "skipping setup of yubikey"
		cd ..
		glib-compile-schemas schemas
		exit
	else
		clear
		echo bad option choose 1 or 2
	fi
done
echo "successfully installed everything you need"
echo "if the setting does not work try 'glib-compile-schemas schemas'
from within the extension folder"
