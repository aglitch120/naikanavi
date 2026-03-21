import re
import xml.etree.ElementTree as ET

def make_flow_svg(title, steps, fid="fs"):
    step_h = 58; gap = 20
    h = 92 + len(steps) * (step_h + gap) + 50
    L = []
    L.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 {h}" role="img" aria-label="{title}">')
    L.append(f'  <defs><filter id="{fid}" x="-4%" y="-4%" width="108%" height="108%"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.08"/></filter>')
    L.append(f'    <marker id="a{fid}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1B4F3A"/></marker></defs>')
    L.append(f'  <rect width="800" height="{h}" rx="16" fill="#F5F4F0"/>')
    L.append(f'  <rect x="24" y="20" width="752" height="52" rx="8" fill="#1B4F3A"/>')
    L.append(f'  <text x="400" y="52" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="18" fill="#fff">{title}</text>')
    y = 92
    for i, (label, desc) in enumerate(steps):
        fill = '#E8F0EC' if i % 2 == 0 else '#FEFEFC'
        L.append(f'  <rect x="160" y="{y}" width="480" height="{step_h}" rx="10" fill="{fill}" filter="url(#{fid})" stroke="#1B4F3A" stroke-width="1.5"/>')
        L.append(f'  <circle cx="190" cy="{y+20}" r="14" fill="#1B4F3A"/>')
        L.append(f'  <text x="190" y="{y+25}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="13" fill="#fff">{i+1}</text>')
        L.append(f'  <text x="214" y="{y+24}" font-family="sans-serif" font-weight="bold" font-size="14" fill="#1A1917">{label}</text>')
        L.append(f'  <text x="214" y="{y+45}" font-family="sans-serif" font-size="11" fill="#6B6760">{desc}</text>')
        if i < len(steps)-1:
            ay = y + step_h
            L.append(f'  <line x1="400" y1="{ay}" x2="400" y2="{ay+gap}" stroke="#1B4F3A" stroke-width="2" marker-end="url(#a{fid})"/>')
        y += step_h + gap
    L.append(f'  <text x="400" y="{h-14}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6B6760">© 内科ナビ naikanavi.com</text>')
    L.append('</svg>')
    return '\n'.join(L)


def make_cards_svg(title, cards, fid="fc"):
    rows = (len(cards) + 1) // 2; card_h = 90; gap = 16
    h = 92 + rows * (card_h + gap) + 50
    L = []
    L.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 {h}" role="img" aria-label="{title}">')
    L.append(f'  <defs><filter id="{fid}" x="-4%" y="-4%" width="108%" height="108%"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.08"/></filter></defs>')
    L.append(f'  <rect width="800" height="{h}" rx="16" fill="#F5F4F0"/>')
    L.append(f'  <rect x="24" y="20" width="752" height="52" rx="8" fill="#1B4F3A"/>')
    L.append(f'  <text x="400" y="52" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="18" fill="#fff">{title}</text>')
    for i, (num, label, d1, d2) in enumerate(cards):
        col = i % 2; row = i // 2
        x = 24 + col * 388; y = 92 + row * (card_h + gap)
        fill = '#E8F0EC' if i % 3 == 0 else '#FEFEFC'
        L.append(f'  <rect x="{x}" y="{y}" width="368" height="{card_h}" rx="10" fill="{fill}" filter="url(#{fid})" stroke="#DDD9D2" stroke-width="1"/>')
        L.append(f'  <circle cx="{x+28}" cy="{y+22}" r="14" fill="#1B4F3A"/>')
        L.append(f'  <text x="{x+28}" y="{y+27}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="13" fill="#fff">{num}</text>')
        L.append(f'  <text x="{x+52}" y="{y+26}" font-family="sans-serif" font-weight="bold" font-size="14" fill="#1A1917">{label}</text>')
        L.append(f'  <text x="{x+52}" y="{y+50}" font-family="sans-serif" font-size="11" fill="#6B6760">{d1}</text>')
        L.append(f'  <text x="{x+52}" y="{y+70}" font-family="sans-serif" font-size="11" fill="#6B6760">{d2}</text>')
    L.append(f'  <text x="400" y="{h-14}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6B6760">© 内科ナビ naikanavi.com</text>')
    L.append('</svg>')
    return '\n'.join(L)


def make_warn_svg(title, items, fid="fw"):
    item_h = 48
    h = 92 + len(items) * item_h + 50
    L = []
    L.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 {h}" role="img" aria-label="{title}">')
    L.append(f'  <defs><filter id="{fid}" x="-4%" y="-4%" width="108%" height="108%"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.08"/></filter></defs>')
    L.append(f'  <rect width="800" height="{h}" rx="16" fill="#F5F4F0"/>')
    L.append(f'  <rect x="24" y="20" width="752" height="52" rx="8" fill="#991B1B"/>')
    L.append(f'  <text x="400" y="52" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="18" fill="#fff">{title}</text>')
    y = 92
    for i, (label, desc) in enumerate(items):
        bg = '#FEE2E2' if i % 2 == 0 else '#FEFEFC'
        L.append(f'  <rect x="40" y="{y}" width="720" height="{item_h-8}" rx="8" fill="{bg}" stroke="#FCA5A5" stroke-width="1"/>')
        L.append(f'  <text x="60" y="{y+18}" font-family="sans-serif" font-weight="bold" font-size="13" fill="#991B1B">{label}</text>')
        L.append(f'  <text x="60" y="{y+35}" font-family="sans-serif" font-size="11" fill="#6B6760">{desc}</text>')
        y += item_h
    L.append(f'  <text x="400" y="{h-14}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6B6760">© 内科ナビ naikanavi.com</text>')
    L.append('</svg>')
    return '\n'.join(L)


def validate(svg_str):
    ET.fromstring(svg_str)
    return True

# Test
validate(make_flow_svg("T", [("A","B"),("C","D")]))
validate(make_cards_svg("T", [("1","A","B","C"),("2","D","E","F")]))
validate(make_warn_svg("T", [("A","B"),("C","D")]))
print("All templates validated")
