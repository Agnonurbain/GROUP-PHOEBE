root=I(null, {"type":"frame","name":"GROUP PHOEBE Design System","width":1200,"height":2000,"layout":"vertical","fill":[{"type":"solid","color":"#0A0A0A"}],"padding":[60,80],"gap":48})

# Title
title=I(root, {"type":"text","content":"GROUP PHOEBE — Design System","fontSize":48,"fontWeight":700,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"}],"letterSpacing":-0.02,"lineHeight":1.1})

# Section: Typography
typo=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
typo_title=I(typo, {"type":"text","content":"Typography — Inter","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

h1_demo=I(typo, {"type":"text","content":"H1 — Inter Bold 48px — Leader Excellence Brilliant","fontSize":48,"fontWeight":700,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"}],"letterSpacing":-0.02,"lineHeight":1.1})
h2_demo=I(typo, {"type":"text","content":"H2 — Inter SemiBold 36px — Notre Flotte de Véhicules","fontSize":36,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"}],"letterSpacing":-0.01,"lineHeight":1.2})
h3_demo=I(typo, {"type":"text","content":"H3 — Inter SemiBold 24px — Toyota Prado V6","fontSize":24,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"}],"lineHeight":1.3})
body_demo=I(typo, {"type":"text","content":"Body — Inter Regular 16px — Découvrez nos véhicules d'exception pour vos déplacements.","fontSize":16,"fontWeight":400,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"}],"lineHeight":1.6})
caption_demo=I(typo, {"type":"text","content":"Caption — Inter Medium 12px — Métadonnées et labels","fontSize":12,"fontWeight":500,"fontFamily":"Inter","fill":[{"type":"solid","color":"#4A4A4A"}],"letterSpacing":0.02,"lineHeight":1.4})

# Section: Buttons
btns_section=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
btns_title=I(btns_section, {"type":"text","content":"Buttons","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

btns_row1=I(btns_section, {"type":"frame","layout":"horizontal","gap":16,"width":"fill_container","height":"fit_content","alignItems":"center"})

# Primary button (Gold - main brand)
btn_primary=I(btns_row1, {"type":"rectangle","role":"button","width":"fit_content","height":56,"padding":[20,32],"cornerRadius":8,"fill":[{"type":"solid","color":"#C9A84C"}],"layout":"horizontal","justifyContent":"center","alignItems":"center","effects":[{"type":"shadow","offsetY":0,"offsetX":0,"blur":20,"spread":0,"color":"rgba(201,168,76,0.3)"}]})
I(btn_primary, {"type":"text","content":"Explorer","fontSize":16,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#0A0A0A"}]})

# Secondary button
btn_secondary=I(btns_row1, {"type":"rectangle","role":"button","width":"fit_content","height":56,"padding":[24,32],"cornerRadius":8,"fill":[{"type":"solid","color":"transparent"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#C9A84C"}]},"layout":"horizontal","justifyContent":"center","alignItems":"center"})
I(btn_secondary, {"type":"text","content":"En savoir plus","fontSize":16,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}]})

# Transport button (Orange)
btn_transport=I(btns_row1, {"type":"rectangle","role":"button","width":"fit_content","height":56,"padding":[24,32],"cornerRadius":8,"fill":[{"type":"solid","color":"#F97316"}],"layout":"horizontal","justifyContent":"center","alignItems":"center","effects":[{"type":"shadow","offsetY":0,"offsetX":0,"blur":20,"spread":0,"color":"rgba(249,115,22,0.3)"}]})
I(btn_transport, {"type":"text","content":"Réserver","fontSize":16,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#FFFFFF"}]})

# Immobilier button (Green)
btn_immobilier=I(btns_row1, {"type":"rectangle","role":"button","width":"fit_content","height":56,"padding":[24,32],"cornerRadius":8,"fill":[{"type":"solid","color":"#059669"}],"layout":"horizontal","justifyContent":"center","alignItems":"center","effects":[{"type":"shadow","offsetY":0,"offsetX":0,"blur":20,"spread":0,"color":"rgba(5,150,105,0.3)"}]})
I(btn_immobilier, {"type":"text","content":"Estimer","fontSize":16,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#FFFFFF"}]})

# Assistance button (Blue)
btn_assistance=I(btns_row1, {"type":"rectangle","role":"button","width":"fit_content","height":56,"padding":[24,32],"cornerRadius":8,"fill":[{"type":"solid","color":"#2563EB"}],"layout":"horizontal","justifyContent":"center","alignItems":"center","effects":[{"type":"shadow","offsetY":0,"offsetX":0,"blur":20,"spread":0,"color":"rgba(37,99,235,0.3)"}]})
I(btn_assistance, {"type":"text","content":"Démarrer","fontSize":16,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#FFFFFF"}]})

# Section: Inputs
inputs_section=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
inputs_title=I(inputs_section, {"type":"text","content":"Inputs & Forms","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

inputs_row=I(inputs_section, {"type":"frame","layout":"horizontal","gap":24,"width":"fill_container","height":"fit_content","alignItems":"center"})

# Text input
input_grp=I(inputs_row, {"type":"frame","role":"form-group","layout":"vertical","gap":8,"width":320})
I(input_grp, {"type":"text","role":"label","content":"Email","fontSize":14,"fontWeight":500,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"}]})
input_field=I(input_grp, {"type":"rectangle","role":"form-input","width":"fill_container","height":56,"cornerRadius":8,"layout":"horizontal","padding":[0,16],"gap":10,"alignItems":"center","fill":[{"type":"solid","color":"#1A1A1A"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#2A2A2A"}]}})
I(input_field, {"type":"text","content":"vous@exemple.com","fontSize":16,"fontFamily":"Inter","fill":[{"type":"solid","color":"#4A4A4A"}]})

# Input with focus state (gold glow)
input_focus=I(input_grp, {"type":"rectangle","role":"form-input","width":"fill_container","height":56,"cornerRadius":8,"layout":"horizontal","padding":[0,16],"gap":10,"alignItems":"center","fill":[{"type":"solid","color":"#1A1A1A"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#C9A84C"}]},"effects":[{"type":"shadow","offsetY":0,"offsetX":0,"blur":12,"spread":0,"color":"rgba(201,168,76,0.2)"}]})
I(input_focus, {"type":"text","content":"Focus state","fontSize":16,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"}]})

# Section: Cards
cards_section=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
cards_title=I(cards_section, {"type":"text","content":"Cards","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

cards_row=I(cards_section, {"type":"frame","layout":"horizontal","gap":24,"width":"fill_container","height":"fit_content"})

# Default card
card_default=I(cards_row, {"type":"rectangle","role":"card","width":280,"height":320,"layout":"vertical","padding":24,"gap":16,"cornerRadius":12,"fill":[{"type":"solid","color":"#141414"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#2A2A2A"]}}})
I(card_default, {"type":"text","content":"Card Default","fontSize":20,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"}]})
I(card_default, {"type":"text","role":"body-text","content":"Fond #141414, bordure 1px #2A2A2A, coins arrondis 12px. Parfait pour les sections de contenu.","fontSize":15,"fontFamily":"Inter","lineHeight":1.6,"fill":[{"type":"solid","color":"#8A8A8A"}]})

# Card with gold accent (feature card)
card_gold=I(cards_row, {"type":"rectangle","role":"feature-card","width":280,"height":320,"layout":"vertical","padding":24,"gap":16,"cornerRadius":12,"fill":[{"type":"solid","color":"#141414"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#C9A84C"}]}})
I(card_gold, {"type":"text","content":"Premium","fontSize":20,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"]})
I(card_gold, {"type":"text","role":"body-text","content":"Carte avec bordure dorée pour les éléments premium et mise en avant.","fontSize":15,"fontFamily":"Inter","lineHeight":1.6,"fill":[{"type":"solid","color":"#8A8A8A"]})

# Section: Badges
badges_section=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
badges_title=I(badges_section, {"type":"text","content":"Badges & Tags","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

badges_row=I(badges_section, {"type":"frame","layout":"horizontal","gap":16,"width":"fill_container","height":"fit_content","alignItems":"center"})

# Badge: Disponible (Green)
badge_available=I(badges_row, {"type":"rectangle","width":"fit_content","height":32,"padding":[8,16],"cornerRadius":16,"fill":[{"type":"solid","color":"rgba(5,150,105,0.15)"}],"layout":"horizontal","justifyContent":"center","alignItems":"center","gap":6})
I(badge_available, {"type":"ellipse","width":8,"height":8,"fill":[{"type":"solid","color":"#059669"}]})
I(badge_available, {"type":"text","content":"Disponible","fontSize":13,"fontWeight":500,"fontFamily":"Inter","fill":[{"type":"solid","color":"#059669"}]})

# Badge: En cours (Orange)
badge_pending=I(badges_row, {"type":"rectangle","width":"fit_content","height":32,"padding":[8,16],"cornerRadius":16,"fill":[{"type":"solid","color":"rgba(249,115,22,0.15)"}],"layout":"horizontal","justifyContent":"center","alignItems":"center","gap":6})
I(badge_pending, {"type":"ellipse","width":8,"height":8,"fill":[{"type":"solid","color":"#F97316"]})
I(badge_pending, {"type":"text","content":"En cours","fontSize":13,"fontWeight":500,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F97316"]})

# Badge: Annulé (Red)
badge_cancelled=I(badges_row, {"type":"rectangle","width":"fit_content","height":32,"padding":[8,16],"cornerRadius":16,"fill":[{"type":"solid","color":"rgba(239,68,68,0.15)"}],"layout":"horizontal","justifyContent":"center","alignItems":"center","gap":6})
I(badge_cancelled, {"type":"ellipse","width":8,"height":8,"fill":[{"type":"solid","color":"#EF4444"]})
I(badge_cancelled, {"type":"text","content":"Annulé","fontSize":13,"fontWeight":500,"fontFamily":"Inter","fill":[{"type":"solid","color":"#EF4444"]})

# Badge: Recommandé (Gold)
badge_reco=I(badges_row, {"type":"rectangle","width":"fit_content","height":28,"padding":[6,12],"cornerRadius":6,"fill":[{"type":"solid","color":"rgba(201,168,76,0.15)"}],"layout":"horizontal","justifyContent":"center","alignItems":"center"})
I(badge_reco, {"type":"text","content":"Recommandé","fontSize":12,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"]})

# Section: Navigation
nav_section=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
nav_title=I(nav_section, {"type":"text","content":"Navigation","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

# Navbar
navbar=I(nav_section, {"type":"frame","role":"navbar","width":"fill_container","height":72,"layout":"horizontal","padding":[0,32],"justifyContent":"space_between","alignItems":"center","fill":[{"type":"solid","color":"#141414"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#2A2A2A"]}},"cornerRadius":12})
I(navbar, {"type":"text","content":"GROUP PHOEBE","fontSize":20,"fontWeight":700,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"]})
nav_links=I(navbar, {"type":"frame","role":"nav-links","layout":"horizontal","gap":24,"width":"fit_content","height":"fit_content"})
I(nav_links, {"type":"text","role":"nav-link","content":"Transport","fontSize":15,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
I(nav_links, {"type":"text","role":"nav-link","content":"Immobilier","fontSize":15,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
I(nav_links, {"type":"text","role":"nav-link","content":"Assistance","fontSize":15,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
nav_cta=I(navbar, {"type":"rectangle","role":"button","padding":[10,20],"cornerRadius":8,"fill":[{"type":"solid","color":"#C9A84C"}],"layout":"horizontal","justifyContent":"center","alignItems":"center"})
I(nav_cta, {"type":"text","content":"Contact","fontSize":14,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#0A0A0A"]})

# Section: Color Palette
colors_section=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
colors_title=I(colors_section, {"type":"text","content":"Color Palette","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

colors_row=I(colors_section, {"type":"frame","layout":"horizontal","gap":16,"width":"fill_container","height":"fit_content"})

# Color swatches
swatch_bg=I(colors_row, {"type":"rectangle","width":80,"height":80,"cornerRadius":12,"fill":[{"type":"solid","color":"#0A0A0A"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#2A2A2A"]}})
swatch_surface=I(colors_row, {"type":"rectangle","width":80,"height":80,"cornerRadius":12,"fill":[{"type":"solid","color":"#141414"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#2A2A2A"]}})
swatch_card=I(colors_row, {"type":"rectangle","width":80,"height":80,"cornerRadius":12,"fill":[{"type":"solid","color":"#1A1A1A"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#2A2A2A"]}})
swatch_gold=I(colors_row, {"type":"rectangle","width":80,"height":80,"cornerRadius":12,"fill":[{"type":"solid","color":"#C9A84C"]})
swatch_orange=I(colors_row, {"type":"rectangle","width":80,"height":80,"cornerRadius":12,"fill":[{"type":"solid","color":"#F97316"]})
swatch_green=I(colors_row, {"type":"rectangle","width":80,"height":80,"cornerRadius":12,"fill":[{"type":"solid","color":"#059669"]})
swatch_blue=I(colors_row, {"type":"rectangle","width":80,"height":80,"cornerRadius":12,"fill":[{"type":"solid","color":"#2563EB"]})

# Section: Price Tag
price_section=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
price_title=I(price_section, {"type":"text","content":"Price Tags","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

price_row=I(price_section, {"type":"frame","layout":"horizontal","gap":24,"width":"fill_container","height":"fit_content","alignItems":"center"})

# Price tag
price_tag=I(price_row, {"type":"rectangle","width":"fit_content","height":"fit_content","padding":[12,24],"cornerRadius":4,"fill":[{"type":"solid","color":"#C9A84C"}],"layout":"horizontal","justifyContent":"center","alignItems":"center"})
I(price_tag, {"type":"text","content":"35 000 FCFA/jour","fontSize":20,"fontWeight":700,"fontFamily":"Inter","fill":[{"type":"solid","color":"#0A0A0A"]})

# Price tag with cut corners (bank note style)
price_tag_cut=I(price_row, {"type":"rectangle","width":"fit_content","height":"fit_content","padding":[12,24],"cornerRadius":4,"fill":[{"type":"solid","color":"#F97316"}],"layout":"horizontal","justifyContent":"center","alignItems":"center"})
I(price_tag_cut, {"type":"text","content":"35 000 FCFA","fontSize":20,"fontWeight":700,"fontFamily":"Inter","fill":[{"type":"solid","color":"#FFFFFF"]})

# Section: Divider
divider=I(root, {"type":"line","x2":1040,"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#2A2A2A"]}})

# Section: Footer preview
footer_section=I(root, {"type":"frame","role":"section","width":"fill_container","height":"fit_content","layout":"vertical","gap":24})
footer_title=I(footer_section, {"type":"text","content":"Footer","fontSize":28,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"}],"letterSpacing":-0.01})

footer=I(footer_section, {"type":"frame","role":"footer","width":"fill_container","height":"fit_content","layout":"horizontal","padding":[48,32],"gap":60,"fill":[{"type":"solid","color":"#0A0A0A"}],"stroke":{"thickness":1,"fill":[{"type":"solid","color":"#2A2A2A"]}},"cornerRadius":12})
col1=I(footer, {"type":"frame","layout":"vertical","gap":16,"width":240})
I(col1, {"type":"text","content":"GROUP PHOEBE","fontSize":20,"fontWeight":700,"fontFamily":"Inter","fill":[{"type":"solid","color":"#C9A84C"]})
I(col1, {"type":"text","content":"Leader Excellence Brilliant","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
col2=I(footer, {"type":"frame","layout":"vertical","gap":12,"width":"fit_content"})
I(col2, {"type":"text","content":"Services","fontSize":14,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"]})
I(col2, {"type":"text","content":"Transport & Livraison","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
I(col2, {"type":"text","content":"Immobilier","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
I(col2, {"type":"text","content":"Assistance Voyages","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
col3=I(footer, {"type":"frame","layout":"vertical","gap":12,"width":"fit_content"})
I(col3, {"type":"text","content":"Contact","fontSize":14,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"]})
I(col3, {"type":"text","content":"info@groupphoebe.com","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
I(col3, {"type":"text","content":"+225 01 02 03 04 05","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
col4=I(footer, {"type":"frame","layout":"vertical","gap":12,"width":"fit_content"})
I(col4, {"type":"text","content":"Légal","fontSize":14,"fontWeight":600,"fontFamily":"Inter","fill":[{"type":"solid","color":"#F5F5F5"]})
I(col4, {"type":"text","content":"Mentions légales","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
I(col4, {"type":"text","content":"CGV","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
I(col4, {"type":"text","content":"Politique de confidentialité","fontSize":14,"fontFamily":"Inter","fill":[{"type":"solid","color":"#8A8A8A"]})
