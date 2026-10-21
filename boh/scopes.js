/* WPH Tower A Basement (BOH) — scope classification rules.
   Each tracker line is put into ONE scope so that the scope counts add up to the room total.
   If the Excel sheet has a column named "Scope" and it is filled for a line, that value wins
   (use one of the scope names below exactly, e.g. "MEP", "Fit-out", "ELV").
   Otherwise the scope is read from the "Outstanding Work listed" text:
     1. phrases such as "after ...", "once ...", "prior to ...", "including ..." are ignored;
     2. among the STRONG keywords, the one that appears FIRST in the sentence decides;
     3. if nothing strong matches, the WEAK fit-out location words (wall, floor, ...) decide;
     4. otherwise the line goes to "General / Other".
   Cable / containment / cabinet work inside ELV rooms (telephone, GSM, Tetra, IDF ...) counts as ELV. */
(function (root) {
  const SCOPES = [
    { code: "MEP", name: "MEP", full: "MEP — Mechanical, Electrical & Plumbing" },
    { code: "FIT", name: "Fit-out", full: "Fit-out — Doors, Ceilings, Finishes & Joinery" },
    { code: "KIT", name: "Kitchen", full: "Kitchen & Cold-Room Equipment" },
    { code: "ELV", name: "ELV", full: "ELV — Data, Telecom, Security & Controls" },
    { code: "FLS", name: "FLS", full: "Fire & Life Safety" },
    { code: "TC",  name: "Testing & Commissioning", full: "Testing, Commissioning & Snagging" },
    { code: "CLN", name: "Cleaning & Handover", full: "Final Cleaning & Handover" },
    { code: "GEN", name: "General / Other", full: "General / Other" }
  ];
  const STRIP = /\b(after|once|following|prior to|before|ready (?:to|for)|including|so (?:that )?)\b[^,;.]*/g;
  const STRONG = [
    ["CLN", /debris|rubbish|housekeep|final (?:room )?clean|general clean|clean (?:the|all) (?:room|equipment|area)|cleaning|loose material|surplus (?:and stored )?material|stored material|stored\/installation material|scaffolding|food waste|clean condition/],
    ["TC",  /testing, commissioning|commissioning|internal snagging|joint inspection|snag list|snag inspection/],
    ["FLS", /service penetration|(?:seal|clos)[a-z]* [^.;]*penetration|fire|sprinkler|smoke detector|heat detector|emergency light|exit sign|intumescent|\bfls\b|hose reel/],
    ["KIT", /cold[- ]room|kitchen equipment|refrigerat|exhaust hood|dishwash|catering equipment/],
    ["ELV", /\belv\b|data point|\bdata\b|telephone|cctv|camera|access control|card reader|\bidf\b|fibre|fiber|network|speaker|public address|intercom|\bbms\b|\bddc\b|tetra|\bgsm\b|wi-?fi|patch panel|\brack\b/],
    ["MEP", /electric|cable|cabling|\bdb\b|socket|switch|light|luminaire|containment|tray|trunking|conduit|duct|diffuser|grille|air[- ]condition|\bac\b|\bahu\b|\bfcu\b|pipe|drain|valve|plumb|sink|basin|sanitary|\bwc\b|insulat|earthing|terminat|generator|transformer|\bmep\b|mechanical|hvac|water|shower|mixer|\btaps?\b|floor box|wall box|box cover|boxes|threaded rod|services|\bups\b|battery|pump|tank|chiller|boiler|meter|thermostat|\bfans?\b|gland|dropper|hanger|sleeve|accessor|cover plate|outlet|third[- ]fix|room-specific equipment|wiring|tapware|cabinet/],
    ["FIT", /ceiling (?:works|grid|tiles?|panels?|close|closure|boards?|openings?|finish)|suspended-ceiling|bulkhead|door|frame|ironmonger|paint|plaster|render|tiles?\b|tiling|grout|sealant|skirting|screed|epoxy|flooring|floor finish|blockwork|glazing|facade|bench ?tops?|joinery|partition|access panel|make good|making good|threshold|cubicle|mirror|signage|shelv|locker|furniture|reveal|soffit|kerb|curb|plinth|concrete|chaser|strap|brace|demolish|shutter|handrail|louvre|cladding|corner guard|expansion joint/]
  ];
  const WEAK = /ceiling|floor|wall|opening|column|finish|fixing/;
  const ELV_ROOM = /entrance facility|telephone|\bgsm\b|tetra|\bidf\b|secu\.? ?control|security control/i;
  const ELV_IN_ROOM = /cable|cabling|containment|tray|cabinet|rack|terminat|dropper|earth/;

  function scopeByName(v) {
    const s = String(v || "").trim().toLowerCase();
    if (!s) return null;
    const f = SCOPES.find(x => x.code.toLowerCase() === s || x.name.toLowerCase() === s);
    if (f) return f.code;
    if (/kitchen/.test(s)) return "KIT";
    if (/fit/.test(s)) return "FIT";
    if (/fire|fls/.test(s)) return "FLS";
    if (/elv|low current/.test(s)) return "ELV";
    if (/mep|mech|elec|plumb/.test(s)) return "MEP";
    if (/test|commission/.test(s)) return "TC";
    if (/clean|handover/.test(s)) return "CLN";
    return "GEN";
  }

  function classify(text, room, override) {
    const o = scopeByName(override);
    if (o) return o;
    const t = " " + String(text || "").toLowerCase().replace(STRIP, " ") + " ";
    let best = null;
    for (const [code, rx] of STRONG) {
      const m = t.match(rx);
      if (m && (best === null || m.index < best[1])) best = [code, m.index];
    }
    let code = best ? best[0] : (WEAK.test(t) ? "FIT" : "GEN");
    if (/^\s*clean\b/.test(t)) code = "CLN";
    if (code === "MEP" && ELV_ROOM.test(String(room || "")) && ELV_IN_ROOM.test(t)) code = "ELV";
    return code;
  }

  const api = { SCOPES, classify };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.BOHScopes = api;
})(this);
