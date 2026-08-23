"""Outreach scripts, one per buyer category.

Each buyer type wants a different first sentence. A euro recycler wants to
hear "one lot, one truck, one price". A body shop wants to hear "used OEM at
a third of the factory price". A liquidator wants to hear "here is a
catalogued lot, what is your commission". Same inventory, three pitches.

Placeholders are filled from a Lead row plus the valuation result.
"""

import valuation

SIGNOFF = """
{seller_name}
{seller_phone}{seller_email_line}
Lot located in New Castle County, DE"""


CALL_SCRIPTS = {
    'euro_recycler': (
        "Hi, I'm looking for whoever handles your parts buying. I have 150 "
        "German body panels here in New Castle County - doors, hoods and "
        "fenders off 2011 to 2016 BMW, Mercedes and Audi. It's one lot, and "
        "I'd rather move it in a single transaction than piece it out. Can I "
        "email you the inventory sheet with photos and paint codes?"
    ),
    'salvage_yard': (
        "Hi - do you buy parts batches to refresh inventory? I've got 150 "
        "clean German body panels in New Castle County: roughly 60 doors, 40 "
        "hoods and 50 fenders, 2011-2016 BMW, Mercedes and Audi. I'll sell "
        "the whole lot at once. Who should I send the list to?"
    ),
    'dismantler': (
        "Hi - I have a 150-piece lot of 2011-2016 German body panels in New "
        "Castle County. You'd want to cherry-pick the high-demand ones, but "
        "I'm looking to move all of it. Can we talk about a number for the "
        "whole lot, or a per-panel price with a minimum take?"
    ),
    'collision_euro': (
        "Hi - I know you work on German cars. I've got used OEM doors, hoods "
        "and fenders for 2011-2016 BMW, Mercedes and Audi sitting in New "
        "Castle County - straight panels, most with glass and regulators "
        "still in. If you're writing estimates with used OEM instead of new "
        "factory, I can quote you a lot cheaper than the dealer. Want the "
        "list of what I have for your common models?"
    ),
    'collision': (
        "Hi - I have used OEM body panels for 2011-2016 German cars, here in "
        "New Castle County. Doors, hoods, fenders. If a used OEM panel would "
        "save you money against a new factory part on an estimate, I can send "
        "you what I have. Interested?"
    ),
    'salvage_auction': (
        "Hi - I'm not selling a vehicle, I'm sitting on 150 clean German body "
        "panels in New Castle County. Your registered buyers are rebuilders "
        "who need exactly this. Is there someone on the buyer side I should "
        "talk to, or a consignment lane that would take a parts lot?"
    ),
    'liquidator': (
        "Hi - I need a quote on liquidating a single commercial lot: 150 "
        "German auto body panels, 2011-2016, appraised in the $12,000 to "
        "$22,000 wholesale range. Everything is in one location in New Castle "
        "County. What's your seller's commission, do you catalogue and "
        "photograph, and what's your realistic timeline to hammer?"
    ),
    'appraiser': (
        "Hi - I need a written appraisal on a commercial parts inventory: 150 "
        "German auto body panels, 2011-2016 model years, in New Castle "
        "County. Are you certified in machinery and technical specialties, "
        "and what do you charge for an inventory of this size?"
    ),
    'parts_store': (
        "Hi - do you buy used OEM body panels? I have 150 German panels in "
        "New Castle County: doors, hoods and fenders for 2011-2016 BMW, "
        "Mercedes and Audi."
    ),
    'scrap': (
        "Hi - what are you paying per ton on clean auto sheet and on "
        "aluminium panels right now? I have around 150 body panels and I want "
        "to know the scrap floor before I sell them as parts."
    ),
}
CALL_SCRIPTS['unknown'] = CALL_SCRIPTS['salvage_yard']


EMAIL_TEMPLATES = {
    'bulk': {
        'subject': '150-piece German body panel lot - New Castle County, DE',
        'body': """Hi{contact},

I'm liquidating a single lot of {total_panels} used OEM German body panels,
located in New Castle County, Delaware:

{mix_lines}

Model years are roughly 2011-2016 - BMW, Mercedes-Benz and Audi. {assembly_note}
Condition across the lot is {condition}. Everything is in one place and can be
loaded onto a box truck or trailer in a single trip.

I'm looking for a one-time buyout of the whole lot rather than piecing it out.
Wholesale appraisal on this inventory is {wholesale_range}.

I can send a full inventory sheet with photos, paint codes and part numbers.
Would you like it, and can you give me a number on the lot?

{signoff}""",
    },
    'shop': {
        'subject': 'Used OEM German panels - doors, hoods, fenders (New Castle County)',
        'body': """Hi{contact},

I have used OEM body panels for 2011-2016 BMW, Mercedes-Benz and Audi in New
Castle County - {total_panels} pieces in total: {mix_short}.

{assembly_note} Most are straight and ready to prep. If you're writing
estimates with used OEM instead of new factory parts, these will come in well
under dealer pricing.

Tell me the models you see most and I'll send you what I have that fits,
with photos and paint codes.

{signoff}""",
    },
    'liquidator': {
        'subject': 'Quote request - commercial liquidation of a {total_panels}-piece parts lot',
        'body': """Hi{contact},

I'd like a quote on liquidating a commercial parts inventory:

  Asset:     {total_panels} used OEM German auto body panels (2011-2016)
  Mix:       {mix_short}
  Location:  Single location, New Castle County, DE
  Appraisal: {wholesale_range} wholesale / {retail_range} at individual retail

Everything is in one place, sorted, and can be photographed and catalogued on
site. I'd like to understand:

  1. Your seller's commission on a lot this size
  2. Whether cataloguing and photography are included
  3. Realistic timeline from consignment to hammer
  4. Who handles removal and loading, and who pays for it

{signoff}""",
    },
}


def build_email(lead, result=None, template=None, seller_name='',
                seller_phone='', seller_email=''):
    """Render the right email for a lead. Returns {'subject', 'body'}."""
    result = result or valuation.value_lot()
    category = (lead.get('category') if isinstance(lead, dict)
                else getattr(lead, 'category', None)) or 'unknown'

    if template is None:
        if category in ('collision', 'collision_euro'):
            template = 'shop'
        elif category in ('liquidator', 'appraiser'):
            template = 'liquidator'
        else:
            template = 'bulk'
    spec = EMAIL_TEMPLATES[template]

    # Greet a named person when we have one; otherwise keep it a plain "Hi,"
    # rather than the "Hi at Acme Auto Parts," that a company name produces.
    person = (lead.get('contact_name') if isinstance(lead, dict)
              else getattr(lead, 'contact_name', None)) or ''
    contact = ' {}'.format(person.split()[0]) if person else ''

    # Drop the "(bare shell)" qualifier in customer-facing copy - the door
    # assembly line below says what the doors actually carry.
    label_for = lambda line: line['label'].split(' (')[0]          # noqa: E731
    mix_lines = '\n'.join(
        '  {:<16} {} pieces'.format(label_for(line), line['count'])
        for line in result['lines'])
    mix_short = ', '.join('{} {}'.format(line['count'], label_for(line).lower())
                          for line in result['lines'])

    assembly_note = ''
    if result['assembly_count']:
        door_count = next((l['count'] for l in result['lines']
                           if l['key'] == 'door'), 0)
        which = ('All of the doors are complete assemblies'
                 if result['assembly_count'] >= door_count
                 else '{} of the doors are complete assemblies'
                      .format(result['assembly_count']))
        assembly_note = ('{} - glass, regulator, latch and wiring still in.'
                         .format(which))

    money = lambda p: '${:,.0f} - ${:,.0f}'.format(p[0], p[1])   # noqa: E731
    fields = {
        'contact': contact,
        'total_panels': result['total_panels'],
        'mix_lines': mix_lines,
        'mix_short': mix_short,
        'assembly_note': assembly_note,
        'condition': result['condition'],
        'wholesale_range': money(result['wholesale_total']),
        'retail_range': money(result['retail_total']),
        'signoff': SIGNOFF.format(
            seller_name=seller_name or '[your name]',
            seller_phone=seller_phone or '[your phone]',
            seller_email_line='\n' + seller_email if seller_email else '').strip(),
    }

    return {
        'subject': spec['subject'].format(**fields),
        'body': spec['body'].format(**fields),
        'template': template,
    }


def call_script(lead):
    category = (lead.get('category') if isinstance(lead, dict)
                else getattr(lead, 'category', None)) or 'unknown'
    return CALL_SCRIPTS.get(category, CALL_SCRIPTS['unknown'])
