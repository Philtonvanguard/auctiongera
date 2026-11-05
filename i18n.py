"""Spanish for the Flask half.

Gettext-style without the toolchain: templates and flash() calls keep their
English text and wrap it in _(), which returns the Spanish below on an /es/
page. A page is Spanish when its route was registered with lang='es' (see
bilingual() in app.py), so a 404 or an English-only page never half-translates.

The legal pages are whole documents, so they are translated as templates in
templates/es/ instead of string by string.

A string wrapped in _() and missing here falls back to English. test_security.py
fails on that, so an English edit cannot ship untranslated.

US Spanish, informal (tú).
"""
from flask import has_request_context, request

ES = {
    # base.html
    'AuctionGera | Barn-Find Car Parts at Auction': 'AuctionGera | Autopartes de granero en subasta',
    'A barn of stored car parts, sold lot by lot at open auction. Inspect in person, bid online, pay cash on pickup.':
        'Un granero lleno de autopartes guardadas, vendidas lote por lote en subasta abierta. '
        'Revísalas en persona, puja en línea y paga en efectivo al recoger.',
    'Skip to content': 'Saltar al contenido',
    'Auctions': 'Subastas',
    'Logout': 'Cerrar sesión',
    'Login': 'Iniciar sesión',
    'Register': 'Regístrate',
    'Menu': 'Menú',
    'One barn, decades of stored car parts, sold lot by lot. Inspect in person, bid online, pay cash on pickup. No buyer fees.':
        'Un granero, décadas de autopartes guardadas, vendidas lote por lote. Revísalas en persona, '
        'puja en línea y paga en efectivo al recoger. Sin comisiones al comprador.',
    'Platform': 'Plataforma',
    'Live Auctions': 'Subastas en vivo',
    'How It Works': 'Cómo funciona',
    'Create Account': 'Crear cuenta',
    'Legal': 'Legal',
    'Terms of Service': 'Términos del servicio',
    'Privacy Policy': 'Política de privacidad',
    'Opt Out / Data Requests': 'Exclusión y solicitudes de datos',
    'Accessibility': 'Accesibilidad',
    'Contact': 'Contacto',
    'Text': 'SMS al',
    'AuctionGera, operated by %(entity)s, a %(jurisdiction)s limited liability company. All rights reserved.':
        'AuctionGera, operado por %(entity)s, una compañía de responsabilidad limitada de %(jurisdiction)s. '
        'Todos los derechos reservados.',

    # login.html
    'Login — AuctionGera': 'Iniciar sesión | AuctionGera',
    'Welcome Back': 'Hola de nuevo',
    'Login to AuctionGera to start bidding': 'Inicia sesión en AuctionGera para empezar a pujar',
    'Username or email': 'Usuario o correo electrónico',
    'Your username or email': 'Tu usuario o correo electrónico',
    'Password': 'Contraseña',
    'Your password': 'Tu contraseña',
    'Remember me': 'Recordarme',
    "Don't have an account?": '¿No tienes cuenta?',
    'Register free': 'Regístrate gratis',

    # register.html
    'Register — AuctionGera': 'Crear cuenta | AuctionGera',
    'Join AuctionGera and start bidding on sheds': 'Únete a AuctionGera y empieza a pujar por autopartes',
    'Username': 'Usuario',
    'Choose a username': 'Elige un nombre de usuario',
    'Email': 'Correo electrónico',
    'your@email.com': 'tu@correo.com',
    'Min. %d characters': 'Mínimo %d caracteres',
    'Confirm Password': 'Confirma la contraseña',
    'Repeat password': 'Repite la contraseña',
    'Already registered?': '¿Ya tienes cuenta?',
    'Login here': 'Inicia sesión aquí',

    # flash() and JSON errors in app.py
    'All fields are required.': 'Todos los campos son obligatorios.',
    'Passwords do not match.': 'Las contraseñas no coinciden.',
    'Password must be at least %d characters.': 'La contraseña debe tener al menos %d caracteres.',
    'Username already taken.': 'Ese nombre de usuario ya está en uso.',
    'Email already registered.': 'Ese correo electrónico ya está registrado.',
    'Account created! Please log in.': 'Cuenta creada. Ahora inicia sesión.',
    'You are already signed in as %s.': 'Ya iniciaste sesión como %s.',
    'Too many failed sign-in attempts for this account. Wait 15 minutes and try again.':
        'Demasiados intentos fallidos para esta cuenta. Espera 15 minutos e inténtalo de nuevo.',
    'Welcome back, %s!': 'Hola de nuevo, %s.',
    'Invalid username or password.': 'Usuario o contraseña incorrectos.',
    'Enter a valid email address.': 'Escribe un correo electrónico válido.',
    'Choose what you would like us to do.': 'Elige qué quieres que hagamos.',
}


def page_lang():
    """'es' on a page served from its /es/ route, else 'en'."""
    if not has_request_context():
        return 'en'
    return (request.view_args or {}).get('lang') or 'en'


def _(text):
    return ES.get(text, text) if page_lang() == 'es' else text
