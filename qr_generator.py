import qrcode

# URL to encode in QR code
url = "http://192.168.90.52:3001/"

# Create QR code instance
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)

# Add data to QR code
qr.add_data(url)
qr.make(fit=True)

# Generate image
img = qr.make_image(fill_color="black", back_color="white")

# Save to file
img.save("local_server_qr.png")

print("QR code saved as 'local_server_qr.png'")
print("Scan this QR code to access:", url)