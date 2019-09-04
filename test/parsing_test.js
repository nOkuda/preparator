import * as parsing from '../src/parsing.js';

test('parse Latin', () => {
  const xmlLines = [
    '<?xml version=\'1.0\' encoding=\'UTF-8\'?>',
    '<?xml-model href="http://www.stoa.org/epidoc/schema/latest/tei-epidoc.rng" schematypens="http://relaxng.org/ns/structure/1.0"?>',
    '',
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">',
    '  <teiHeader>',
    '    <fileDesc>',
    '      <titleStmt>',
    '        <title type="work" n="Eleg.">Elegies</title>',
    '        <title type="sub">Machine readable text</title>',
    '        <author n="Prop.">Sextus Propertius</author>',
    '        <editor>Lucian Mueller</editor>',
    '<sponsor>Perseus Project, Tufts University</sponsor>',
    '    <principal>Gregory Crane</principal>',
    '    <respStmt>',
    '    <resp>Prepared under the supervision of</resp>',
    '      <name>Bridget Almas</name>',
    '    <name>Lisa Cerrato</name>',
    '    <name>William Merrill</name>',
    '    <name>David Smith</name>',
    '    </respStmt>',
    '<funder n="org:NEH">The National Endowment for the Humanities</funder>    ',
    '      </titleStmt>',
    '      <extent>about 35 Kb</extent>',
    '        <publicationStmt>',
    '    <publisher>Trustees of Tufts University</publisher>',
    '    <pubPlace>Medford, MA</pubPlace>',
    '    <authority>Perseus Project</authority>',
    '          <date type="release">2000-08-01</date>',
    '    </publicationStmt>',
    '      <sourceDesc>',
    '        <biblStruct>',
    '          <monogr>',
    '            <author>Propertius</author>',
    '            <title>Elegies</title>',
    '            <respStmt>',
    '              <name>Lucian Mueller</name>',
    '              <resp>editor</resp>',
    '            </respStmt>',
    '            <imprint>',
    '              <pubPlace>Leipzig</pubPlace>',
    '              <publisher>Teubner</publisher>',
    '              <date>1898</date>',
    '              <note>Machine readable text of this edition was posted on the Latin Library (http://www.thelatinlibrary.com) by Konrad Schroder</note>',
    '            </imprint>',
    '          </monogr>',
    '    ',
    '        </biblStruct>',
    '      </sourceDesc>',
    '    </fileDesc>',
    '',
    '    <encodingDesc>',
    '      <refsDecl n="CTS">',
    '        <cRefPattern n="line" matchPattern="(\\d+).(\\d+).(\\d+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:div[@n=\'$2\']//tei:l[@n=\'$3\'])">',
    '          <p>This pattern extracts book</p>',
    '        </cRefPattern>',
    '        <cRefPattern n="poem" matchPattern="(\\d+).(\\d+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:div[@n=\'$2\'])">',
    '          <p>This pattern extracts book</p>',
    '        </cRefPattern>',
    '        <cRefPattern n="book" matchPattern="(\\d+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\'])">',
    '          <p>This pattern extracts book</p>',
    '        </cRefPattern>',
    '      </refsDecl>',
    '    </encodingDesc>',
    '',
    '    <profileDesc>',
    '      <langUsage>',
    '        <language ident="lat">Latin</language>',
    '      </langUsage>',
    '    </profileDesc>',
    '    <revisionDesc>',
    '      <change who="SI" when="1998-12-02">Text scanned, proofread and tagged by SI.</change>',
    '      <change who="SI" when="1998-12-08">Text of Prop. 1 proofread and tagged, added tei header which',
    '        needs revision; changed landando 1.4.1 to laudando</change>',
    '      <change who="AEM" when="2000-06-19">Unknown</change>',
    '      <change who="Thibault Clérice" when="2016-11-14">Epidoc, CapiTainS and line numbering</change>',
    '    </revisionDesc>',
    '  </teiHeader>',
    '<text>',
    '<body>',
    '  <div type="edition" n="urn:cts:latinLit:phi0620.phi001.perseus-lat3" xml:lang="lat">',
    '<div type="textpart" subtype="book" n="1">',
    '<div type="textpart" subtype="poem" n="1">',
    '<l n="1">Cynthia prima suis miserum me cepit ocellis,</l>',
    '</div>',
    '',
    '<div type="textpart" subtype="poem" n="2">',
    '<l n="1">Quid iuvat ornato procedere, vita, capillo</l>',
    '<l n="2">et tenuis Coa veste movere sinus,</l>',
    '</div>',
    '</div>',
    '<div type="textpart" subtype="book" n="2">',
    '<div type="textpart" subtype="poem" n="1">',
    '<l n="1">Quaeritis, unde mihi totiens scribantur amores,</l>',
    '<l n="2">unde meus veniat mollis in ore liber.</l>',
    '</div>',
    '</div>',
    '<div type="textpart" subtype="book" n="4">',
    '<div type="textpart" subtype="poem" n="1">',
    '<l n="101"><q>Iunonis facito uotum impetrabile</q> dixi:</l>',
    '</div>',
    '</div></div></body></text></TEI>'
  ]
  const xmlString = xmlLines.join('\n');
  const parsedObj = parsing.getParsedObj(xmlString);

  const title = parsing.getTitleAbbreviation(parsedObj);
  expect(title).toEqual('Eleg.');

  const author = parsing.getAuthorAbbreviation(parsedObj);
  expect(author).toEqual('Prop.');

  const structure = parsing.getCTSStructure(parsedObj);
  expect(structure).toEqual(['book', 'poem', 'line']);

  const tessLines = parsing.makeTess(parsedObj, author, title, structure).split('\n');
  const expecteds = [
    '<Prop. Eleg. 1.1.1>	Cynthia prima suis miserum me cepit ocellis,',
    '<Prop. Eleg. 1.2.1>	Quid iuvat ornato procedere, vita, capillo',
    '<Prop. Eleg. 1.2.2>	et tenuis Coa veste movere sinus,',
    '<Prop. Eleg. 2.1.1>	Quaeritis, unde mihi totiens scribantur amores,',
    '<Prop. Eleg. 2.1.2>	unde meus veniat mollis in ore liber.',
    '<Prop. Eleg. 4.1.101>	“Iunonis facito uotum impetrabile” dixi:'
  ]
  expect(tessLines).toEqual(expecteds);
})

test('handle no given abbreviation', () => {
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.21/tei-epidoc.rng"',
    '    schematypens="http://relaxng.org/ns/structure/1.0"?>',
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.21/tei-epidoc.rng"',
    '    schematypens="http://purl.oclc.org/dsdl/schematron"?>',
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">',
    '  <teiHeader>',
    '      <fileDesc>',
    '         <titleStmt>',
    '            <title>Historiae Alexandri Magni</title>',
    '            <author>Curtius Rufus, Quintus</author>',
    '            <editor>Edmund Hedicke</editor>',
    '            <sponsor>Perseus Project, Tufts University</sponsor>',
    '            <principal>Gregory Crane</principal>',
    '            <respStmt>',
    '               <resp>Prepared under the supervision of</resp>',
    '               <name>Bridget Almas</name>',
    '               <name>Lisa Cerrato</name>',
    '               <name>Rashmi Singhal</name>',
    '            </respStmt>',
    '            <funder n="org:Mellon">The Mellon Foundation</funder>',
    '         </titleStmt>',
    '         <publicationStmt>',
    '            <publisher>Trustees of Tufts University</publisher>',
    '            <pubPlace>Medford, MA</pubPlace>',
    '            <authority>Perseus Project</authority>',
    '            <date type="release">2011-04-14</date>',
    '         </publicationStmt>',
    '         <sourceDesc>',
    '            <biblStruct>',
    '               <monogr>',
    '                  <author>Curtius Rufus, Quintus</author>',
    '                  <title>Historiarum Alexandri Magni Macedonis libri qui supersunt</title>',
    '                  <editor>Edmund Hedicke</editor>',
    '                  <imprint>',
    '                     <publisher>in aedibus B.G. Teubneri</publisher>',
    '                     <pubPlace>Lipsiae</pubPlace>',
    '                     <date>1908</date>',
    '                  </imprint>',
    '               </monogr>',
    '            </biblStruct>',
    '',
    '            <!--<p>Keyboarding</p>-->',
    '         </sourceDesc>',
    '      </fileDesc>',
    '',
    '      <encodingDesc>',
    '         <refsDecl n="CTS">',
    '            <cRefPattern n="section" matchPattern="(\\d+).(\\w+).(\\d+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:div[@n=\'$2\']/tei:div[@n=\'$3\'])">',
    '               <p>This pointer pattern extracts section</p>',
    '            </cRefPattern>',
    '            <cRefPattern n="chapter" matchPattern="(\\d+).(\\w+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:div[@n=\'$2\'])">',
    '               <p>This pointer pattern extracts chapter</p>',
    '            </cRefPattern>',
    '            <cRefPattern n="book" matchPattern="(\\d+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\'])">',
    '               <p>This pointer pattern extracts book</p>',
    '            </cRefPattern>',
    '         </refsDecl>',
    '         <refsDecl n="TEI.2">',
    '            <refState unit="book"/>',
    '            <refState unit="chapter" n="chunk"/>',
    '            <refState unit="section"/>',
    '         </refsDecl>',
    '',
    '',
    '      </encodingDesc>',
    '',
    '      <profileDesc>',
    '         <langUsage>',
    '	           <language ident="lat">Latin</language>',
    '	           <language ident="grc">Greek</language>',
    '         </langUsage>',
    '      </profileDesc>',
    '      <revisionDesc>',
    '         <change when="2016-11-16" who="Thibault Clérice">CapiTainS, Epidoc and Bumped URN</change>',
    '      </revisionDesc>',
    '  </teiHeader>',
    '   <text xml:lang="lat">',
    '      <body>',
    '         <div xml:lang="lat"',
    '              type="edition"',
    '              n="urn:cts:latinLit:phi0860.phi001.perseus-lat2">',
    '            <pb n="p.3"/>',
    '',
    '            <div type="textpart" n="3" subtype="book">',
    '',
    '               <div type="textpart" n="1" subtype="chapter">',
    '                  <div type="textpart" n="1" subtype="section">',
    '                     <p>',
    'Inter haec Alexander ad conducendum ex',
    'Peloponneso militem Cleandro cum pecunia misso Lyciae',
    'Pamphyliaeque rebus conpositis ad urbem Celaenas',
    'exercitum admovit.',
    '</p>',
    '                  </div>',
    '',
    '                  <div type="textpart" n="2" subtype="section">',
    '                     <p>Media ilia tempestate moenia',
    ' interfluebat Marsyas, amnis fabulosis Graecorum',
    'carminibus inclitus.',
    '</p>',
    '                  </div></div></div></div></body>,</text>',
    '</TEI>'
  ]
  const xmlString = xmlLines.join('\n');
  const parsedObj = parsing.getParsedObj(xmlString);

  const title = parsing.getTitleAbbreviation(parsedObj);
  expect(title).toEqual('Historiae Alexandri Magni');

  const author = parsing.getAuthorAbbreviation(parsedObj);
  expect(author).toEqual('Curtius Rufus, Quintus');

  const structure = parsing.getCTSStructure(parsedObj);
  expect(structure).toEqual(['book', 'chapter', 'section']);

  const tessLines = parsing.makeTess(parsedObj, 'curt.', 'alex.', structure).split('\n');
  const expecteds = [
    '<curt. alex. 3.1.1>	Inter haec Alexander ad conducendum ex Peloponneso militem Cleandro cum pecunia misso Lyciae Pamphyliaeque rebus conpositis ad urbem Celaenas exercitum admovit.',
    '<curt. alex. 3.1.2>	Media ilia tempestate moenia interfluebat Marsyas, amnis fabulosis Graecorum carminibus inclitus.'
  ]
  expect(tessLines).toEqual(expecteds);
})

test('ignore text not properly in a unit', () => {
  const xmlLines = [
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.19/tei-epidoc.rng"',
    '  schematypens="http://relaxng.org/ns/structure/1.0"?>',
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.19/tei-epidoc.rng"',
    '  schematypens="http://purl.oclc.org/dsdl/schematron"?>',
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">',
    '  <teiHeader>',
    '    <fileDesc>',
    '      <titleStmt>',
    '        <title type="work">Epitome Rerum Romanorum</title>',
    '	       <title type="sub">Machine readable text</title>',
    '        <author n="Florus, Lucius Annaeus">Florus, Lucius Annaeus</author>',
    '        <funder n="org:Tufts">Tufts University</funder>',
    '        <principal>Gregory Crane</principal>',
    '        <sponsor>Perseus Project, Tufts University</sponsor>',
    '        <respStmt>',
    '          <resp>Prepared under the supervision of</resp>',
    '          <name>Bridget Almas</name>',
    '          <name>Lisa Cerrato</name>',
    '          <name>Rashmi Singhal</name>',
    '        </respStmt>',
    '      </titleStmt>',
    '      <publicationStmt>',
    '<publisher>Trustees of Tufts Universities</publisher>',
    '<pubPlace>Medford, MA</pubPlace>',
    '<authority>Perseus Project</authority>',
    '        <date type="release">2011-03-14</date>',
    '</publicationStmt>',
    '',
    '      <sourceDesc>',
    '        <biblStruct>',
    '          <monogr>',
    '            <title>Lucius Annaeus Florus, Epitome of Roman history</title>',
    '            <author>Florus, Lucius Annaeus</author>',
    '            <editor>Edward Seymour Forster</editor>',
    '            <imprint>',
    '              <publisher>London: William Heinemann; New York: G.P. Putnam\'s Sons</publisher>',
    '              <date>1929</date>',
    '            </imprint>',
    '          </monogr>',
    '        </biblStruct><list>',
    '               <item>Keyboarding</item>',
    '            </list></sourceDesc>',
    '    </fileDesc>',
    '',
    '<encodingDesc>',
    '            <refsDecl n="CTS">',
    '		<cRefPattern n="section" matchPattern="(\\w+).(\\w+).(\\w+).(\\w+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:div[@n=\'$2\']/tei:div[@n=\'$3\']/tei:div[@n=\'$4\'])">',
    '                    <p>This pointer pattern extracts Book and Topic and Chapter and Section</p>',
    '		</cRefPattern>',
    '		              <cRefPattern n="chapter" matchPattern="(\\w+).(\\w+).(\\w+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:div[@n=\'$2\']/tei:div[@n=\'$3\'])">',
    '                    <p>This pointer pattern extracts Book and Topic and Chapter</p>',
    '                </cRefPattern>',
    '                <cRefPattern n="topic" matchPattern="(\\w+).(\\w+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:div[@n=\'$2\'])">',
    '                    <p>This pointer pattern extracts Book and Topic</p>',
    '                </cRefPattern>',
    '                <cRefPattern n="book" matchPattern="(\\w+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\'])">',
    '                    <p>This pointer pattern extracts Book</p>',
    '                </cRefPattern>',
    '            </refsDecl>',
    '            <refsDecl>',
    '                <refState unit="book" delim="."/>',
    '		<refState unit="topic" delim="."/>',
    '                <refState unit="chapter" delim="."/>',
    '                <refState unit="section"/>',
    '            </refsDecl>',
    '        </encodingDesc>',
    '',
    '    <profileDesc>',
    '      <langUsage>',
    '	<language ident="lat">Latin</language>',
    '	<language ident="grc">Greek</language>',
    '      </langUsage>',
    '    </profileDesc>',
    '<revisionDesc>',
    '	<change who="Zach Himes" when="2015-11-11">Converted to TEI P5 and EpiDoc</change>',
    '</revisionDesc>',
    '  </teiHeader>',
    '<text xml:lang="lat"><body><div type="edition" xml:lang="lat" n="urn:cts:latinLit:phi1242.phi001.perseus-lat1">',
    '',
    '<div type="textpart" n="1" subtype="book">',
    '<pb n="p.4"/>',
    '',
    '<div type="textpart" n="1" subtype="topic"><head>A Romulo tempora regum septem </head>',
    '<div type="textpart" n="pr" subtype="chapter">',
    '<div type="textpart" n="1" subtype="section"><p>',
    'Populus Romanus a rege Romulo in Caesarem Augustum septingentos per annos tantum operum pace belloque gessit, ut, si quis magnitudinem imperii cum annis conferat, aetatem ultra putet.',
    '</p></div></div></div></div></div></body></text>',
    '</TEI>'
  ]
  const xmlString = xmlLines.join('\n');
  const parsedObj = parsing.getParsedObj(xmlString);

  const title = parsing.getTitleAbbreviation(parsedObj);
  expect(title).toEqual('Epitome Rerum Romanorum');

  const author = parsing.getAuthorAbbreviation(parsedObj);
  expect(author).toEqual('Florus, Lucius Annaeus');

  const structure = parsing.getCTSStructure(parsedObj);
  expect(structure).toEqual(['book', 'topic', 'chapter', 'section']);

  const tessLines = parsing.makeTess(parsedObj, 'flor.', 'epitome.', structure).split('\n');
  const expecteds = [
    '<flor. epitome. 1.1.pr.1>	Populus Romanus a rege Romulo in Caesarem Augustum septingentos per annos tantum operum pace belloque gessit, ut, si quis magnitudinem imperii cum annis conferat, aetatem ultra putet.'
  ]
  expect(tessLines).toEqual(expecteds);
})

test('eliminate unnecessary whitespace', () => {
  const xmlLines = [
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.22/tei-epidoc.rng"',
    '  schematypens="http://relaxng.org/ns/structure/1.0"?><?xml-model href="http://www.stoa.org/epidoc/schema/8.22/tei-epidoc.rng"',
    '  schematypens="http://purl.oclc.org/dsdl/schematron"?><TEI xmlns="http://www.tei-c.org/ns/1.0">',
    '  <teiHeader>',
    '    <fileDesc>',
    '      <titleStmt>',
    '        <title>Vitellius from De Vita Caesarum</title>',
    '        <title type="sub">Machine readable text</title>',
    '        <author>C. Suetonius Tranquillus</author>',
    '        <editor role="editor">Maximilian Ihm</editor>',
    '        <sponsor>Perseus Project, Tufts University</sponsor>',
    '        <respStmt>',
    '          <resp>Prepared under the supervision of</resp>',
    '          <name>Bridget Almas</name>',
    '          <name>Lisa Cerrato</name>',
    '          <name>William Merrill</name>',
    '          <name>David Smith</name>',
    '        </respStmt>',
    '        <funder n="org:FIPSE">Fund for the Improvement of Postsecondary Education</funder> ',
    '      </titleStmt>',
    '      <publicationStmt>',
    '        <publisher>Trustees of Tufts University</publisher>',
    '        <pubPlace>Medford, MA</pubPlace>',
    '        <authority>Perseus Project</authority>',
    '        <date type="release">2000-08-01</date>',
    '      </publicationStmt>',
    '      ',
    '',
    '      <sourceDesc>',
    '        <bibl><idno type="ISBN">3519018276</idno></bibl>',
    '      </sourceDesc>',
    '    </fileDesc>',
    '',
    '    <encodingDesc><refsDecl n="CTS"><cRefPattern n="chapter" matchPattern="(\\w+)" replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\'])"><p>This pointer pattern extracts chapter</p></cRefPattern></refsDecl><refsDecl>',
    '        <refState delim=" " unit="life"/>',
    '        <refState delim="." unit="chapter"/>',
    '        <refState unit="section"/>',
    '      </refsDecl>',
    '      ',
    '    </encodingDesc>',
    '',
    '    <profileDesc>',
    '      <langUsage>',
    '        <language ident="lat">Latin</language>',
    '        <language ident="grc">Greek</language>',
    '      </langUsage>',
    '    </profileDesc>',
    '',
    '    <revisionDesc>',
    '<change when="2016-11-18" who="Thibault Clérice">Capitains, CTS and Bump</change>',
    '      <change when="2014-10-01" who="Stella Dee">edited markup</change>',
    '      <change when="2014-07-01" who="Stella Dee">split speeches and converted to unicode</change>',
    '<change who="balmas01" when="2013-09-13">reverting texts back to pre_cts_reorg tagged version</change>',
    '<change who="gcrane" when="2011-01-17">start file</change>',
    '<change who="rsingh04" when="2009-12-08">moved more xml files around based on copyright status</change>',
    '<change who="packel" when="2005-07-25">Converted to XML</change>',
    '<change who="amahoney" when="2004-07-19">mark spaced type as quotes in Nero, more abbreviations</change>',
    '<change who="amahoney" when="2004-07-16">be consistent about abbreviation for Caius</change>',
    '<change who="amahoney" when="2004-04-22">for readability, remove editorial brackets within words</change>',
    '<change who="dbrooks" when="2004-04-03">Trying to fix the "book 1" error in ToC</change>',
    '<change who="amahoney" when="2004-04-02">turn books into milestones so they needn\'t show up in the short toc</change>',
    '<change who="yorkc" when="2003-07-01">Updated texts to TEI P4 and Perseus P4 extensions; minor cleanup (esp. character encodings and typos.)</change>',
    '<change who="amahoney" when="2000-03-07">fix section breaks, especially those in mid-word!</change>',
    '<change who="amahoney" when="2000-03-06">remove header so books show up in short toc (probably won\'t getthe actual lives)</change>',
    '',
    '<change who="dasmith" when="2000-03-04">Added separate funder entity to TEI header.</change>',
    '<change who="amahoney" when="2000-02-25">mark up a few features as examples of what can be done</change>',
    '<change who="amahoney" when="2000-02-22">fix refsdecl and divs for citation scheme, add n to "life" forabbreviation lookup</change>',
    '',
    '<change who="dasmith" when="2000-01-28">Sorry to have led the IDNO astray.</change>',
    '<change who="amahoney" when="1999-11-01">remove consecutive paragraph breaks at start of chapter</change>',
    '<change who="amahoney" when="1999-10-29">Add to repository;  SGML syntax minimally correct.</change>',
    ' </revisionDesc>',
    '  </teiHeader>',
    '  <text xml:lang="">',
    '    <body><div xml:lang="lat" type="edition" n="urn:cts:latinLit:phi1348.abo019.perseus-lat2">',
    '      <div type="textpart" n="1" subtype="chapter">',
    '        <milestone n="1" unit="section"/>',
    '        <p>Vitelliorum originem alii aliam et quidem diuersissimam tradunt, partim ueterem et',
    '          nobilem, partim uero nouam et obscuram atque etiam sordidam; quod ego per adulatores',
    '          obtrectatoresque imperatoris Vitelli euenisse opinarer, nisi aliquanto prius de familiae',
    '          condicione uariatum esset. <milestone n="2" unit="section"/> extat Q. †Elogi ad Quintum',
    '          Vitellium Diui Augusti quaestorem libellus, quo continetur, Vitellios Fauno Aboriginum',
    '          rege et Vitellia, quae multis locis pro numine coleretur, ortos toto Latio imperasse;',
    '          horum residuam stirpem ex Sabinis transisse Romam atque inter patricios adlectam;',
    '            <milestone n="3" unit="section"/> indicia stirpis mansisse diu uiam Vitelliam ab',
    '          Ianiculo ad mare usque, item coloniam eiusdem nominis, quam gentili copia aduersus',
    '          Aequiculos tutandam olim depoposcissent; tempore deinde Samnitici belli praesidio in',
    '          Apuliam misso quosdam ex Vitellis subsedisse Nuceriae eorumque progeniem longo post',
    '          interuallo repetisse urbem atque ordinem senatorium.</p>',
    '      </div></div></body></text></TEI>',
  ]
  const xmlString = xmlLines.join('\n');
  const parsedObj = parsing.getParsedObj(xmlString);

  const title = parsing.getTitleAbbreviation(parsedObj);
  expect(title).toEqual('Vitellius from De Vita Caesarum');

  const author = parsing.getAuthorAbbreviation(parsedObj);
  expect(author).toEqual('C. Suetonius Tranquillus');

  const structure = parsing.getCTSStructure(parsedObj);
  expect(structure).toEqual(['chapter']);

  const tessLines = parsing.makeTess(parsedObj, 'suet.', 'vitellius.', structure).split('\n');
  const expecteds = [
'<suet. vitellius. 1>	Vitelliorum originem alii aliam et quidem diuersissimam tradunt, partim ueterem et nobilem, partim uero nouam et obscuram atque etiam sordidam; quod ego per adulatores obtrectatoresque imperatoris Vitelli euenisse opinarer, nisi aliquanto prius de familiae condicione uariatum esset. extat Q. †Elogi ad Quintum Vitellium Diui Augusti quaestorem libellus, quo continetur, Vitellios Fauno Aboriginum rege et Vitellia, quae multis locis pro numine coleretur, ortos toto Latio imperasse; horum residuam stirpem ex Sabinis transisse Romam atque inter patricios adlectam; indicia stirpis mansisse diu uiam Vitelliam ab Ianiculo ad mare usque, item coloniam eiusdem nominis, quam gentili copia aduersus Aequiculos tutandam olim depoposcissent; tempore deinde Samnitici belli praesidio in Apuliam misso quosdam ex Vitellis subsedisse Nuceriae eorumque progeniem longo post interuallo repetisse urbem atque ordinem senatorium.'
  ]
  expect(tessLines).toEqual(expecteds);
})

test('eliminate unnecessary whitespace 2', () => {
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.19/tei-epidoc.rng"',
    '    schematypens="http://relaxng.org/ns/structure/1.0"?>',
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.19/tei-epidoc.rng"',
    '    schematypens="http://purl.oclc.org/dsdl/schematron"?>',
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">',
    '    <teiHeader>',
    '        <fileDesc>',
    '            <titleStmt>',
    '                <title>Eclogarum Liber</title>                ',
    '                <author>Ausonius, Decimus Magnus</author>',
    '               <editor>Hugh G. Evelyn-White</editor>',
    '               <sponsor>Perseus Project, Tufts University</sponsor>',
    '               <principal>Gregory Crane</principal>',
    '               <respStmt>',
    '                  <resp>Prepared under the supervision of</resp>',
    '                  <name>Bridget Almas</name>',
    '                  <name>Lisa Cerrato</name>',
    '                  <name>Rashmi Singhal</name>',
    '               </respStmt>',
    '               <funder n="org:Mellon">The Mellon Foundation</funder>',
    '            </titleStmt>',
    '           <publicationStmt>',
    '              <publisher>Trustees of Tufts University</publisher>',
    '              <pubPlace>Medford, MA</pubPlace>',
    '              <authority>Perseus Project</authority>',
    '              <date type="release">2011-07-09</date>',
    '           </publicationStmt>',
    '            <sourceDesc>',
    '                <biblStruct>',
    '                    <monogr>',
    '                        <title>Ausonius. Works.</title>',
    '                        <title>Ausonius, Vol 1</title>',
    '                        <author>Ausonius, Decimus Magnus</author>',
    '                        <editor role="editor">Hugh G. Evelyn-White</editor>',
    '                        <imprint>',
    '                            <publisher>William Heinemann Ltd.; Harvard University Press</publisher>',
    '                            <pubPlace>London; Cambridge, Massachusetts</pubPlace>',
    '                            <date>1919</date>',
    '                        </imprint>',
    '                    </monogr>',
    '                    <ref target="https://archive.org/stream/deciausonius01ausouoft#page/208/mode/2up">Internet Archive</ref>',
    '                </biblStruct>',
    '         </sourceDesc>',
    '        </fileDesc>',
    '        ',
    '        <encodingDesc>',
    '         <refsDecl n="CTS">',
    '            <cRefPattern n="line"',
    '                         matchPattern="(\\w+).(\\w+)"',
    '                         replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:l[@n=\'$2\'])">',
    '               <p>This pointer pattern extracts line</p>',
    '            </cRefPattern>',
    '            <cRefPattern n="poem"',
    '                         matchPattern="(\\w+)"',
    '                         replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\'])">',
    '               <p>This pointer pattern extracts poem and line</p>',
    '            </cRefPattern>',
    '         </refsDecl>',
    '         <refsDecl n="TEI.2">',
    '            <refState unit="card"/>',
    '         </refsDecl>',
    '      </encodingDesc>',
    '        ',
    '        <profileDesc>',
    '            <langUsage>',
    '                <language ident="lat">Latin</language>',
    '                <language ident="grc">Greek</language>',
    '            </langUsage>',
    '        </profileDesc>',
    '      <revisionDesc>',
    '         <change when="2015-12-07" who="Thibault Clérice">Epidoc and CTS. URN updated accordingly</change>',
    '      </revisionDesc>',
    '   </teiHeader>',
    '    <text>',
    '        <body>',
    '         <div n="urn:cts:latinLit:stoa0045.stoa007.perseus-lat2"',
    '              xml:lang="lat"',
    '              type="edition">            ',
    '            <div type="textpart" n="1" subtype="section">',
    '               <l n="13">',
    '                  <q> Pacatum haut dubie, poeta, dicis? </q>',
    '               </l>',
    '            </div>',
    '</div></body></text></TEI>'
  ]

  const xmlString = xmlLines.join('\n');
  const parsedObj = parsing.getParsedObj(xmlString);

  const title = parsing.getTitleAbbreviation(parsedObj);
  expect(title).toEqual('Eclogarum Liber');

  const author = parsing.getAuthorAbbreviation(parsedObj);
  expect(author).toEqual('Ausonius, Decimus Magnus');

  const structure = parsing.getCTSStructure(parsedObj);
  expect(structure).toEqual(['poem', 'line']);

  const tessLines = parsing.makeTess(parsedObj, 'aus.', 'ecl.', structure).split('\n');
  const expecteds = [
    '<aus. ecl. 1.13>	“Pacatum haut dubie, poeta, dicis?”'
  ]
  expect(tessLines).toEqual(expecteds);
})

test('add and delete tags', () => {
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.21/tei-epidoc.rng"',
    '    schematypens="http://relaxng.org/ns/structure/1.0"?>',
    '<?xml-model href="http://www.stoa.org/epidoc/schema/8.21/tei-epidoc.rng"',
    '    schematypens="http://purl.oclc.org/dsdl/schematron"?>',
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">',
    '	<teiHeader>',
    '		<fileDesc>',
    '			<titleStmt>',
    '				<title type="work">De Medicina</title>',
    '				<title type="sub">Machine readable text</title>',
    '				<author>Celsus</author>',
    '				<editor role="editor" n="Marx">Friedrich Marx</editor>',
    '				<sponsor>Perseus Project, Tufts University</sponsor>',
    '		<principal>Gregory Crane</principal>',
    '		<respStmt>',
    '		<resp>Prepared under the supervision of</resp>',
    '		<name>Bridget Almas</name>',
    '		<name>Lisa Cerrato</name>',
    '		<name>Rashmi Singhal</name>',
    '		</respStmt>',
    '				<funder n="org:Tufts">Tufts University</funder>',
    '			</titleStmt>',
    '			<extent/>',
    '			<publicationStmt>',
    '		<publisher>Trustees of Tufts University</publisher>',
    '		<pubPlace>Medford, MA</pubPlace>',
    '		<authority>Perseus Project</authority>',
    '				<date type="release">2009-10-07</date>',
    '		</publicationStmt>',
    '			<sourceDesc>',
    '				<biblStruct>',
    '					<monogr>',
    '						<title>A. Cornelii Celsi quae supersunt</title>',
    '						<author>Celsus</author>',
    '						<editor role="editor" n="Marx">Friedrich Marx</editor>',
    '						<imprint>',
    '							<pubPlace>Lipsiae</pubPlace>',
    '							<publisher>Teubner</publisher>',
    '							<date>1915</date>',
    '						</imprint>',
    '					</monogr>',
    '				</biblStruct>',
    '			</sourceDesc>',
    '		</fileDesc>',
    '		',
    '		<encodingDesc>',
    '			<refsDecl> ',
    '				<refState unit="book"/>',
    '				<refState unit="chapter" n="chunk"/>',
    '				<refState unit="section"/>',
    '			</refsDecl> ',
    '			<!--<refsDecl> ',
    '				<state unit="page"/> ',
    '				</refsDecl>--> ',
    '	         <refsDecl n="CTS">',
    '	            <cRefPattern n="chapter"',
    '	                         matchPattern="(\\w+).(\\w+)"',
    '	                         replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\']/tei:div[@n=\'$2\'])">',
    '	                <p>This pointer pattern extracts book and chapter</p>',
    '	            </cRefPattern>',
    '	            <cRefPattern n="book"',
    '	                         matchPattern="(\\w+)"',
    '	                         replacementPattern="#xpath(/tei:TEI/tei:text/tei:body/tei:div/tei:div[@n=\'$1\'])">',
    '	                <p>This pointer pattern extracts book</p>',
    '	            </cRefPattern>',
    '	        </refsDecl>',
    '		</encodingDesc>',
    '		',
    '		<profileDesc>',
    '			<langUsage>',
    '				<language ident="lat">Latin</language>',
    '				<language ident="greek">Greek</language>',
    '			</langUsage>',
    '		</profileDesc>',
    '		<revisionDesc>',
    '			<change when="2009-01-01" who="GRC">Tagging</change>',
    '			<change when="2016-11-16" who="Thibault Clerice">CapiTainS, Epidoc, Bump</change>',
    '		</revisionDesc>',
    '	</teiHeader>',
    '	',
    '	<text>',
    '		<body>',
    '			<div type="edition" n="urn:cts:latinLit:phi0836.phi002.perseus-lat6" xml:lang="lat">',
    '',
    '			<pb n="p.17"/>',
    '			<div type="textpart" subtype="book" n="1">',
    '				<div type="textpart" subtype="chapter" n="pr">',
    '						<milestone unit="section" n="12"/>Quoniam autem ex <del>tribus</del> medicinae partibus ut difficillima, sic etiam clarissima est ea, quae morbis medetur, ante omnia de hac dicendum est. Et quia prima in e<add>o</add> dissensio est, quod alii sibi experimentorum tantummodo notitiam necessariam esse contendunt, alii nisi corporum rerumque ratione comperta non satis potentem usum esse proponunt, indicandum est, quae maxime ex utraque parte dicantur, quo facilius nostra quoque opinio interponi possit.',
    '    </div></div></div></body></text></TEI>',
  ]

  const xmlString = xmlLines.join('\n');
  const parsedObj = parsing.getParsedObj(xmlString);

  const title = parsing.getTitleAbbreviation(parsedObj);
  expect(title).toEqual('De Medicina');

  const author = parsing.getAuthorAbbreviation(parsedObj);
  expect(author).toEqual('Celsus');

  const structure = parsing.getCTSStructure(parsedObj);
  expect(structure).toEqual(['book', 'chapter']);

  const tessLines = parsing.makeTess(parsedObj, 'Cels.', 'Med.', structure).split('\n');
  const expecteds = [
    '<Cels. Med. 1.pr>	Quoniam autem ex medicinae partibus ut difficillima, sic etiam clarissima est ea, quae morbis medetur, ante omnia de hac dicendum est. Et quia prima in eo dissensio est, quod alii sibi experimentorum tantummodo notitiam necessariam esse contendunt, alii nisi corporum rerumque ratione comperta non satis potentem usum esse proponunt, indicandum est, quae maxime ex utraque parte dicantur, quo facilius nostra quoque opinio interponi possit.'
  ]
  expect(tessLines).toEqual(expecteds);
})
