-- log.lua
-- Copyright (C) 2020 by RStudio, PBC

-- TODO
-- could write to named filed (e.g. <docname>.filter.log) and client could read warnings and delete (also delete before run)
-- always append b/c multiple filters

function info(message)
  io.stderr:write(message .. "\n")
end

function warn(message) 
  io.stderr:write(lunacolors.yellow("WARNING: " .. message .. "\n"))
end

function error(message)
  io.stderr:write(lunacolors.red("ERROR: " .. message .. "\n"))
end


-- colors.lua
-- Copyright (C) 2020 by RStudio, PBC

-- These colors are used as background colors with an opacity of 0.75
kColorUnknown = "909090"
kColorNote = "0758E5"
kColorImportant = "CC1914"
kColorWarning = "EB9113"
kColorTip = "00A047"
kColorCaution = "FC5300"

-- these colors are used with no-opacity
kColorUnknownFrame = "acacac"
kColorNoteFrame = "4582ec"
kColorImportantFrame = "d9534f"
kColorWarningFrame = "f0ad4e"
kColorTipFrame = "02b875"
kColorCautionFrame = "fd7e14"

kBackgroundColorUnknown = "e6e6e6"
kBackgroundColorNote = "dae6fb"
kBackgroundColorImportant = "f7dddc"
kBackgroundColorWarning = "fcefdc"
kBackgroundColorTip = "ccf1e3"
kBackgroundColorCaution = "ffe5d0"

function latexXColor(color) 
  -- remove any hash at the front
  color = pandoc.utils.stringify(color)
  color = color:gsub("#","")

  local hexCount = 0
  for match in color:gmatch "%x%x" do
    hexCount = hexCount + 1
  end

  if hexCount == 3 then
    -- this is a hex color
    return "{HTML}{" .. color .. "}"
  else
    -- otherwise treat it as a named color
    -- and hope for the best
    return '{named}{' .. color .. '}' 
  end
end

-- converts a hex string to a RGB
function hextoRgb(hex)
  -- remove any leading #
  hex = hex:gsub("#","")

  -- convert to 
  return {
    red = tonumber("0x"..hex:sub(1,2)), 
    green = tonumber("0x"..hex:sub(3,4)), 
    blue = tonumber("0x"..hex:sub(5,6))
  }
end


-- lunacolors.lua
--
-- Copyright (c) 2021, Hilbis
-- https://github.com/Rosettea/Lunacolors

lunacolors = {}

function init(name, codes)
	lunacolors[name] = function(text)
		return ansi(codes[1], codes[2], text)
	end
end

function ansi(open, close, text)
	if text == nil then return '\27[' .. open .. 'm' end
	return '\27[' .. open .. 'm' .. text .. '\27[' .. close .. 'm'
end

-- Define colors
-- Modifiers
init('reset', {0, 0})
init('bold', {1, 22})
init('dim', {2, 22})
init('italic', {3, 23})
init('underline', {4, 24})
init('invert', {7, 27})
init('hidden', {8, 28})
init('strikethrough', {9, 29})

-- Colors
init('black', {30, 39})
init('red', {31, 39})
init('green', {32, 39})
init('yellow', {33, 39})
init('blue', {34, 39})
init('magenta', {35, 39})
init('cyan', {36, 39})
init('white', {37, 39})

-- Background colors
init('blackBg', {40, 49})
init('redBg', {41, 49})
init('greenBg', {42, 49})
init('yellowBg', {43, 49})
init('blueBg', {44, 49})
init('magentaBg', {45, 49})
init('cyanBg', {46, 49})
init('whiteBg', {47, 49})

-- Bright colors
init('brightBlack', {90, 39})
init('brightRed', {91, 39})
init('brightGreen', {92, 39})
init('brightYellow', {93, 39})
init('brightBlue', {94, 39})
init('brightMagenta', {95, 39})
init('brightCyan', {96, 39})
init('brightWhite', {97, 39})

-- Bright background 
init('brightBlackBg', {100, 49})
init('brightRedBg', {101, 49})
init('brightGreenBg', {102, 49})
init('brightYellowBg', {103, 49})
init('brightBlueBg', {104, 49})
init('brightMagentaBg', {105, 49})
init('brightCyanBg', {106, 49})
init('brightWhiteBg', {107, 49})

lunacolors.version = '0.1.0'
lunacolors.format = function(text)
	local colors = {
		reset = {'{reset}', ansi(0)},
		bold = {'{bold}', ansi(1)},
		dim = {'{dim}', ansi(2)},
		italic = {'{italic}', ansi(3)},
		underline = {'{underline}', ansi(4)},
		invert = {'{invert}', ansi(7)},
		bold_off = {'{bold-off}', ansi(22)},
		underline_off = {'{underline-off}', ansi(24)},
		black = {'{black}', ansi(30)},
		red = {'{red}', ansi(31)},
		green = {'{green}', ansi(32)},
		yellow = {'{yellow}', ansi(33)},
		blue = {'{blue}', ansi(34)},
		magenta = {'{magenta}', ansi(35)},
		cyan = {'{cyan}', ansi(36)},
		white = {'{white}', ansi(37)},
		red_bg = {'{red-bg}', ansi(41)},
		green_bg = {'{green-bg}', ansi(42)},
		yellow_bg = {'{green-bg}', ansi(43)},
		blue_bg = {'{blue-bg}', ansi(44)},
		magenta_bg = {'{magenta-bg}', ansi(45)},
		cyan_bg = {'{cyan-bg}', ansi(46)},
		white_bg = {'{white-bg}', ansi(47)},
		gray = {'{gray}', ansi(90)},
		bright_red = {'{bright-red}', ansi(91)},
		bright_green = {'{bright-green}', ansi(92)},
		bright_yellow = {'{bright-yellow}', ansi(93)},
		bright_blue = {'{bright-blue}', ansi(94)},
		bright_magenta = {'{bright-magenta}', ansi(95)},
		bright_cyan = {'{bright-cyan}', ansi(96)}
	}

	for k, v in pairs(colors) do
		text = text:gsub(v[1], v[2])
	end

	return text .. colors['reset'][2]
end

-- debug.lua
-- Copyright (C) 2020 by RStudio, PBC

-- improved formatting for dumping tables
function tdump (tbl, indent, refs)
  if not refs then refs = {} end
  if not indent then indent = 0 end
  local address = string.format("%p", tbl)
  if refs[address] ~= nil then
    print(string.rep("  ", indent) .. "(circular reference to " .. address .. ")")
    return
  end

  if tbl.t then
    print(string.rep("  ", indent) .. tbl.t)
  end
  local empty = true
  for k, v in pairs(tbl) do
    empty = false
    formatting = string.rep("  ", indent) .. k .. ": "
    v = asLua(v)
    if type(v) == "table" then
      print(formatting .. "table: " .. address)
      refs[address] = true
      tdump(v, indent+1, refs)
    elseif type(v) == 'boolean' then
      print(formatting .. tostring(v))
    elseif (v ~= nil) then 
      print(formatting .. tostring(v))
    else 
      print(formatting .. 'nil')
    end
  end
  if empty then
    print(string.rep("  ", indent) .. "<empty table>")
  end
end

function asLua(o)
  if type(o) ~= 'userdata' then
    return o
  end
  
  if rawequal(o, PANDOC_READER_OPTIONS) then
    return {
      abbreviations = o.abbreviations,
      columns = o.columns,
      default_image_extension = o.default_image_extension,
      extensions = o.extensions,
      indented_code_classes = o.indented_code_classes,
      standalone = o.standalone,
      strip_comments = o.strip_comments,
      tab_stop = o.tab_stop,
      track_changes = o.track_changes,
    }
  elseif rawequal(o, PANDOC_WRITER_OPTIONS) then
    return {
      cite_method = o.cite_method,
      columns = o.columns,
      dpi = o.dpi,
      email_obfuscation = o.email_obfuscation,
      epub_chapter_level = o.epub_chapter_level,
      epub_fonts = o.epub_fonts,
      epub_metadata = o.epub_metadata,
      epub_subdirectory = o.epub_subdirectory,
      extensions = o.extensions,
      highlight_style = o.highlight_style,
      html_math_method = o.html_math_method,
      html_q_tags = o.html_q_tags,
      identifier_prefix = o.identifier_prefix,
      incremental = o.incremental,
      listings = o.listings,
      number_offset = o.number_offset,
      number_sections = o.number_sections,
      prefer_ascii = o.prefer_ascii,
      reference_doc = o.reference_doc,
      reference_links = o.reference_links,
      reference_location = o.reference_location,
      section_divs = o.section_divs,
      setext_headers = o.setext_headers,
      slide_level = o.slide_level,
      tab_stop = o.tab_stop,
      table_of_contents = o.table_of_contents,
      template = o.template,
      toc_depth = o.toc_depth,
      top_level_division = o.top_level_division,
      variables = o.variables,
      wrap_text = o.wrap_text
    }
  end
  v = tostring(o)
  if string.find(v, "^pandoc CommonState") then
    return {
      input_files = o.input_files,
      output_file = o.output_file,
      log = o.log,
      request_headers = o.request_headers,
      resource_path = o.resource_path,
      source_url = o.source_url,
      user_data_dir = o.user_data_dir,
      trace = o.trace,
      verbosity = o.verbosity
    }
  elseif string.find(v, "^pandoc LogMessage") then
    return v
  end
  return o
end

-- dump an object to stdout
local function dump(o)
  o = asLua(o)
  if type(o) == 'table' then
    tdump(o)
  else
    print(tostring(o) .. "\n")
  end
end

-- table.lua
-- Copyright (C) 2020 by RStudio, PBC

-- append values to table
function tappend(t, values)
  for i,value in pairs(values) do
    table.insert(t, value)
  end
end

-- prepend values to table
function tprepend(t, values)
  for i=1, #values do
   table.insert(t, 1, values[#values + 1 - i])
  end
end

-- slice elements out of a table
function tslice(t, first, last, step)
  local sliced = {}
  for i = first or 1, last or #t, step or 1 do
    sliced[#sliced+1] = t[i]
  end
  return sliced
end

-- is the table a simple array?
-- see: https://web.archive.org/web/20140227143701/http://ericjmritz.name/2014/02/26/lua-is_array/
function tisarray(t)
  local i = 0
  for _ in pairs(t) do
      i = i + 1
      if t[i] == nil then return false end
  end
  return true
end

-- map elements of a table
function tmap(tbl, f)
  local t = {}
  for k,v in pairs(tbl) do
      t[k] = f(v)
  end
  return t
end

-- does the table contain a value
function tcontains(t,value)
  if t and type(t)=="table" and value then
    for _, v in ipairs (t) do
      if v == value then
        return true
      end
    end
    return false
  end
  return false
end

-- clear a table
function tclear(t)
  for k,v in pairs(t) do
    t[k] = nil
  end
end

-- get keys from table
function tkeys(t)
  local keyset=pandoc.List({})
  local n=0
  for k,v in pairs(t) do
    n=n+1
    keyset[n]=k
  end
  return keyset
end

-- sorted pairs. order function takes (t, a,)
function spairs(t, order)
  -- collect the keys
  local keys = {}
  for k in pairs(t) do keys[#keys+1] = k end

  -- if order function given, sort by it by passing the table and keys a, b,
  -- otherwise just sort the keys
  if order then
      table.sort(keys, function(a,b) return order(t, a, b) end)
  else
      table.sort(keys)
  end

  -- return the iterator function
  local i = 0
  return function()
      i = i + 1
      if keys[i] then
          return keys[i], t[keys[i]]
      end
  end
end

-- meta.lua
-- Copyright (C) 2020 by RStudio, PBC

-- constants
kHeaderIncludes = "header-includes"
kIncludeBefore = "include-before"
kIncludeAfter = "include-after"

function ensureIncludes(meta, includes)
  if not meta[includes] then
    meta[includes] = pandoc.List({})
  elseif pandoc.utils.type(meta[includes]) == "Inlines" or 
         pandoc.utils.type(meta[includes]) == "Blocks" then
    meta[includes] = pandoc.List({meta[includes]})
  end
end

function removeEmptyIncludes(meta, includes)
  if meta[includes] and 
     pandoc.utils.type(meta[includes]) == "List" and
     #meta[includes] == 0 then
    meta[includes] = nil
  end
end

function removeAllEmptyIncludes(meta)
  removeEmptyIncludes(meta, kHeaderIncludes)
  removeEmptyIncludes(meta, kIncludeBefore)
  removeEmptyIncludes(meta, kIncludeAfter)
end

-- add a header include as a raw block
function addInclude(meta, format, includes, include)
  if _quarto.format.isHtmlOutput() then
    blockFormat = "html"
  else
    blockFormat = format
  end  
  meta[includes]:insert(pandoc.Blocks({ pandoc.RawBlock(blockFormat, include) }))
end

-- conditionally include a package
function usePackage(pkg)
  return "\\@ifpackageloaded{" .. pkg .. "}{}{\\usepackage{" .. pkg .. "}}"
end

function usePackageWithOption(pkg, option)
  return "\\@ifpackageloaded{" .. pkg .. "}{}{\\usepackage[" .. option .. "]{" .. pkg .. "}}"
end

function metaInjectLatex(meta, func)
  if _quarto.format.isLatexOutput() then
    function inject(tex)
      addInclude(meta, "tex", kHeaderIncludes, tex)
    end
    inject("\\makeatletter")
    func(inject)
    inject("\\makeatother")
  end
end

function metaInjectLatexBefore(meta, func)
  metaInjectRawLatex(meta, kIncludeBefore, func)
end

function metaInjectLatexAfter(meta, func)
  metaInjectRawLatex(meta, kIncludeAfter, func)
end

function metaInjectRawLatex(meta, include, func)
  if _quarto.format.isLatexOutput() then
    function inject(tex)
      addInclude(meta, "tex", include, tex)
    end
    func(inject)
  end
end


function metaInjectHtml(meta, func)
  if _quarto.format.isHtmlOutput() then
    function inject(html)
      addInclude(meta, "html", kHeaderIncludes, html)
    end
    func(inject)
  end
end


function readMetaOptions(meta) 
  local options = {}
  for key,value in pairs(meta) do
    if type(value) == "table" and value.clone ~= nil then
      options[key] = value:clone()
    else
      options[key] = value
    end 
  end
  return options
end

-- options.lua
-- Copyright (C) 2020 by RStudio, PBC

-- initialize options from 'crossref' metadata value
function readFilterOptions(meta, filter)
  local options = {}
  if type(meta[filter]) == "table" then
    options = readMetaOptions(meta[filter])
  end
  return options
end

-- get option value
function readOption(options, name, default)
  local value = options[name]
  if value == nil then
    value = default
  end

  if type(value) == "table" and value.clone ~= nil then
    return value:clone()
  else
    return value;
  end
end




-- tables.lua
-- Copyright (C) 2021 by RStudio, PBC

function htmlTableCaptionPattern()
  return tagPattern("[Cc][Aa][Pp][Tt][Ii][Oo][Nn]")
end

function htmlTableTagNamePattern()
  return "[Tt][Aa][Bb][Ll][Ee]"
end

function htmlTablePattern()
  return tagPattern(htmlTableTagNamePattern())
end

function htmlPagedTablePattern()
  return "<script data[-]pagedtable[-]source type=\"application/json\">"
end

function htmlGtTablePattern()
  return "<table class=\"gt_table\">"
end

function tagPattern(tag)
  local pattern = "(<" .. tag .. "[^>]*>)(.*)(</" .. tag .. ">)"
  return pattern
end

function anonymousTblId()
  return "tbl-anonymous-" .. tostring(math.random(10000000))
end

function isAnonymousTblId(identifier)
  return string.find(identifier, "^tbl%-anonymous-")
end

function isReferenceableTbl(tblEl)
  return tblEl.attr.identifier ~= "" and 
         not isAnonymousTblId(tblEl.attr.identifier)
end


function parseTableCaption(caption)
  -- string trailing space
  caption = stripTrailingSpace(caption)
  -- does the caption end with "}"
  local lastInline = caption[#caption]
  if lastInline.t == "Str" then
    if endsWith(trim(lastInline.text), "}") then
      -- find index of first inline that starts with "{"
      local beginIndex = nil
      for i = 1,#caption do 
        if caption[i].t == "Str" and startsWith(caption[i].text, "{") then
          beginIndex = i
          break
        end
      end
      if beginIndex ~= nil then 
        local attrText = trim(inlinesToString(tslice(caption, beginIndex, #caption)))
        attrText = attrText:gsub("“", "'"):gsub("”", "'")
        local elWithAttr = pandoc.read("## " .. attrText).blocks[1]
        if elWithAttr.attr ~= nil then
          if not startsWith(attrText, "{#") then
            elWithAttr.attr.identifier = ""
          end
          if beginIndex > 1 then
            return stripTrailingSpace(tslice(caption, 1, beginIndex - 1)), elWithAttr.attr
          else
            return pandoc.List({}), elWithAttr.attr
          end
        end
      end
    end   
  end

  -- no attributes
  return caption, pandoc.Attr("")

end

function createTableCaption(caption, attr)
  -- convert attr to inlines
  local attrInlines = pandoc.List()
  if attr.identifier ~= nil and attr.identifier ~= "" then
    attrInlines:insert(pandoc.Str("#" .. attr.identifier))
  end
  if #attr.classes > 0 then
    for i = 1,#attr.classes do
      if #attrInlines > 0 then
        attrInlines:insert(pandoc.Space())
      end
      attrInlines:insert(pandoc.Str("." .. attr.classes[i]))
    end
  end
  if #attr.attributes > 0 then
    for k,v in pairs(attr.attributes) do
      if #attrInlines > 0 then
        attrInlines:insert(pandoc.Space())
      end
      attrInlines:insert(pandoc.Str(k .. "='" .. v .. "'"))
    end
  end
  if #attrInlines > 0 then
    attrInlines:insert(1, pandoc.Space())
    attrInlines[2] = pandoc.Str("{" .. attrInlines[2].text)
    attrInlines[#attrInlines] = pandoc.Str(attrInlines[#attrInlines].text .. "}")
    local tableCaption = caption:clone()
    tappend(tableCaption, attrInlines)
    return tableCaption
  else
    return caption
  end
end


function countTables(div)
  local tables = 0
  pandoc.walk_block(div, {
    Table = function(table)
      tables = tables + 1
    end,
    RawBlock = function(raw)
      if hasTable(raw) then
        tables = tables + 1
      end
    end
  })
  return tables
end

function hasGtHtmlTable(raw)
  if _quarto.format.isRawHtml(raw) and _quarto.format.isHtmlOutput() then
    return raw.text:match(htmlGtTablePattern())
  else
    return false
  end
end

function hasPagedHtmlTable(raw)
  if _quarto.format.isRawHtml(raw) and _quarto.format.isHtmlOutput() then
    return raw.text:match(htmlPagedTablePattern())
  else
    return false
  end
end

function hasRawHtmlTable(raw)
  if _quarto.format.isRawHtml(raw) and _quarto.format.isHtmlOutput() then
    return raw.text:match(htmlTablePattern())
  else
    return false
  end
end

function hasRawLatexTable(raw)
  if _quarto.format.isRawLatex(raw) and _quarto.format.isLatexOutput() then
    for i,pattern in ipairs(_quarto.patterns.latexTablePatterns) do
      if raw.text:match(pattern) then
        return true
      end
    end
    return false
  else
    return false
  end
end

local tableCheckers = {
  hasRawHtmlTable,
  hasRawLatexTable,
  hasPagedHtmlTable,
}

function hasTable(raw)
  for i, checker in ipairs(tableCheckers) do
    local val = checker(raw)
    if val ~= nil then
      return true
    end
  end
  return false
end

-- figures.lua
-- Copyright (C) 2020 by RStudio, PBC

-- constants for figure attributes
kFigAlign = "fig-align"
kFigEnv = "fig-env"
kFigAlt = "fig-alt"
kFigPos = "fig-pos"
kFigCap = "fig-cap"
kFigScap = "fig-scap"
kResizeWidth = "resize.width"
kResizeHeight = "resize.height"


function isFigAttribute(name)
  return string.find(name, "^fig%-")
end

function figAlignAttribute(el)
  local default = pandoc.utils.stringify(
    param(kFigAlign, pandoc.Str("default"))
  )
  local align = attribute(el, kFigAlign, default)
  if align == "default" then
    align = default
  end
  return validatedAlign(align)
end

-- is this an image containing a figure
function isFigureImage(el)
  return hasFigureRef(el) and #el.caption > 0
end

-- is this a Div containing a figure
function isFigureDiv(el)
  if el.t == "Div" and hasFigureRef(el) then
    return refCaptionFromDiv(el) ~= nil
  else
    return discoverLinkedFigureDiv(el) ~= nil
  end
end

function discoverFigure(el, captionRequired)
  if el.t ~= "Para" then
    return nil
  end
  if captionRequired == nil then
    captionRequired = true
  end
  if #el.content == 1 and el.content[1].t == "Image" then
    local image = el.content[1]
    if not captionRequired or #image.caption > 0 then
      return image
    else
      return nil
    end
  else
    return nil
  end
end

function discoverLinkedFigure(el, captionRequired)
  if el.t ~= "Para" then
    return nil
  end
  if #el.content == 1 then 
    if el.content[1].t == "Link" then
      local link = el.content[1]
      if #link.content == 1 and link.content[1].t == "Image" then
        local image = link.content[1]
        if not captionRequired or #image.caption > 0 then
          return image
        end
      end
    end
  end
  return nil
end

function createFigureDiv(paraEl, fig)
  
  -- create figure div
  local figureDiv = pandoc.Div({})
 
  -- transfer identifier
  figureDiv.attr.identifier = fig.attr.identifier
  fig.attr.identifier = ""
  
  -- provide anonymous identifier if necessary
  if figureDiv.attr.identifier == "" then
    figureDiv.attr.identifier = anonymousFigId()
  end
  
  -- transfer classes
  figureDiv.attr.classes = fig.attr.classes:clone()
  tclear(fig.attr.classes)
  
  -- transfer fig. attributes
  for k,v in pairs(fig.attr.attributes) do
    if isFigAttribute(k) then
      figureDiv.attr.attributes[k] = v
    end
  end
  local attribs = tkeys(fig.attr.attributes)
  for _,k in ipairs(attribs) do
    if isFigAttribute(k) then
      fig.attr.attributes[k] = v
    end
  end
    
  --  collect caption
  local caption = fig.caption:clone()
  fig.caption = {}
  
  -- if the image is a .tex file we need to tex \input 
  if latexIsTikzImage(fig) then
    paraEl = pandoc.walk_block(paraEl, {
      Image = function(image)
        return latexFigureInline(image, preState)
      end
    })
  end
  
  -- insert the paragraph and a caption paragraph
  figureDiv.content:insert(paraEl)
  figureDiv.content:insert(pandoc.Para(caption))
  
  -- return the div
  return figureDiv
  
end

function discoverLinkedFigureDiv(el, captionRequired)
  if el.t == "Div" and 
     hasFigureRef(el) and
     #el.content == 2 and 
     el.content[1].t == "Para" and 
     el.content[2].t == "Para" then
    return discoverLinkedFigure(el.content[1], captionRequired)  
  end
  return nil
end

local anonymousCount = 0
function anonymousFigId()
  anonymousCount = anonymousCount + 1
  return "fig-anonymous-" .. tostring(anonymousCount)
end

function isAnonymousFigId(identifier)
  return string.find(identifier, "^fig%-anonymous-")
end

function isReferenceableFig(figEl)
  return figEl.attr.identifier ~= "" and 
         not isAnonymousFigId(figEl.attr.identifier)
end



function latexIsTikzImage(image)
  return _quarto.format.isLatexOutput() and string.find(image.src, "%.tex$")
end

function latexFigureInline(image, state)
  -- if this is a tex file (e.g. created w/ tikz) then use \\input
  if latexIsTikzImage(image) then
    
    -- be sure to inject \usepackage{tikz}
    state.usingTikz = true
    
    -- base input
    local input = "\\input{" .. image.src .. "}"
    
    -- apply resize.width and/or resize.height if specified
    local rw = attribute(image, kResizeWidth, attribute(image, "width", "!"))
    local rh = attribute(image, kResizeHeight, attribute(image, "height", "!"))

    -- convert % to linewidth
    rw = asLatexSize(rw)
    rh = asLatexSize(rh)

    if rw ~= "!" or rh ~= "!" then
      input = "\\resizebox{" .. rw .. "}{" .. rh .. "}{" .. input .. "}"
    end
    
    -- return inline
    return pandoc.RawInline("latex", input)
  else
    return image
  end
end




-- layout.lua
-- Copyright (C) 2020 by RStudio, PBC

kLayoutAlign = "layout-align"
kLayoutVAlign = "layout-valign"
kLayoutNcol = "layout-ncol"
kLayoutNrow = "layout-nrow"
kLayout = "layout"


function layoutAlignAttribute(el, default)
  return validatedAlign(attribute(el, kLayoutAlign, default))
end

function layoutVAlignAttribute(el, default)
  return validatedVAlign(attribute(el, kLayoutVAlign, default))
end

function hasLayoutAttributes(el)
  local attribs = tkeys(el.attr.attributes)
  return attribs:includes(kLayoutNrow) or
         attribs:includes(kLayoutNcol) or
         attribs:includes(kLayout)
end

function isLayoutAttribute(key)
  return key == kLayoutNrow or
         key == kLayoutNcol or
         key == kLayout
end

-- locate an image in a layout cell
function figureImageFromLayoutCell(cellDivEl)
  for _,block in ipairs(cellDivEl.content) do
    local fig = discoverFigure(block, false)
    if not fig then
      fig = discoverLinkedFigure(block, false)
    end
    if not fig then
      fig = discoverLinkedFigureDiv(block, false)
    end
    if fig then
      return fig
    end
  end
  return nil
end


-- we often wrap a table in a div, unwrap it
function tableFromLayoutCell(cell)
  if #cell.content == 1 and cell.content[1].t == "Table" then
    return cell.content[1]
  else
    return nil
  end
end

-- resolve alignment for layout cell (default to center or left depending
-- on the content in the cell)
function layoutCellAlignment(cell, align)
  if not align then
    local image = figureImageFromLayoutCell(cell) 
    local tbl = tableFromLayoutCell(cell)
    if image or tbl then
      return "center"
    else
      return "left"
    end
  else
    return align
  end
end

-- does the layout cell have a ref parent
function layoutCellHasRefParent(cell)
  if hasRefParent(cell) then
    return true
  else
    local image = figureImageFromLayoutCell(cell)
    if image then
      return hasRefParent(image)
    end
  end
  return false
end

function sizeToPercent(size)
  if size then
    local percent = string.match(size, "^([%d%.]+)%%$")
    if percent then
      return tonumber(percent)
    end
  end
  return nil
end

function asLatexSize(size, macro)
  -- default to linewidth
  if not macro then
    macro = "linewidth"
  end
  -- see if this is a percent, if it is the conver 
  local percentSize = sizeToPercent(size)
  if percentSize then
    if percentSize == 100 then
      return "\\" .. macro
    else
      return string.format("%2.2f", percentSize/100) .. "\\" .. macro
    end
  else
    return size
  end
end



-- ref parent attribute (e.g. fig:parent or tbl:parent)
kRefParent = "ref-parent"


-- does this element have a figure label?
function hasFigureRef(el)
  return isFigureRef(el.attr.identifier)
end

function isFigureRef(identifier)
  return (identifier ~= nil) and string.find(identifier, "^fig%-")
end

-- does this element have a table label?
function hasTableRef(el)
  return isTableRef(el.attr.identifier)
end

function isTableRef(identifier)
  return (identifier ~= nil) and string.find(identifier, "^tbl%-")
end

-- does this element support sub-references
function hasFigureOrTableRef(el)
  return el.attr and (hasFigureRef(el) or hasTableRef(el))
end


function isRefParent(el)
  return el.t == "Div" and 
         (hasFigureRef(el) or hasTableRef(el)) and
         refCaptionFromDiv(el) ~= nil
end

function hasRefParent(el)
  return el.attr.attributes[kRefParent] ~= nil
end

function refType(id)
  local match = string.match(id, "^(%a+)%-")
  if match then
    return pandoc.text.lower(match)
  else
    return nil
  end
end

function refCaptionFromDiv(el)
  local last = el.content[#el.content]
  if last and last.t == "Para" and #el.content > 1 then
    return last
  else
    return nil
  end
end

function noCaption()
  return pandoc.Strong( { pandoc.Str("?(caption)") })
end

function emptyCaption()
  return pandoc.Str("")
end

function hasSubRefs(divEl, type)
  if hasFigureOrTableRef(divEl) and not hasRefParent(divEl) then
    -- children w/ parent id
    local found = false
    function checkForParent(el)
      if not found then
        if hasRefParent(el) then
          if not type or (refType(el.attr.identifier) == type) then
            found = true
          end
        end

      end
    end
    pandoc.walk_block(divEl, {
      Div = checkForParent,
      Image = checkForParent
    })
    return found
  else
    return false
  end
end
   



-- format.lua
-- Copyright (C) 2020 by RStudio, PBC

function round(num, numDecimalPlaces)
  local mult = 10^(numDecimalPlaces or 0)
  return math.floor(num * mult + 0.5) / mult
end

-- validate.lua
-- Copyright (C) 2020 by RStudio, PBC

kAlignments = pandoc.List({ "center", "left", "right" })
kVAlignments = pandoc.List({"top", "center", "bottom"})

function validatedAlign(align)
  return validateInList(align, kAlignments, "alignment", "center")
end

function validatedVAlign(vAlign)
  return validateInList(vAlign, kVAlignments, "vertical alignment", "top")
end

function validateInList(value, list, attribute, default)
  if value == "default" then
    return default
  elseif value and not list:includes(value) then
    warn("Invalid " .. attribute .. " attribute value: " .. value)
    return default
  elseif value then
    return value
  else
    return default
  end
end



-- pandoc.lua
-- Copyright (C) 2020 by RStudio, PBC

function hasBootstrap() 
  local hasBootstrap = param("has-bootstrap", false)
  return hasBootstrap
end


-- read attribute w/ default
function attribute(el, name, default)
  for k,v in pairs(el.attr.attributes) do
    if k == name then
      return v
    end
  end
  return default
end

function removeClass(classes, remove)
  return classes:filter(function(clz) return clz ~= remove end)
end

function combineFilters(filters) 

  -- the final list of filters
  local filterList = {}
  for _, filter in ipairs(filters) do
    for key,func in pairs(filter) do

      -- ensure that there is a list for this key
      if filterList[key] == nil then
        filterList[key] = pandoc.List()
      end

      -- add the current function to the list
      filterList[key]:insert(func)
    end
  end

  local combinedFilters = {}
  for key,fns in pairs(filterList) do

    combinedFilters[key] = function(x) 
      -- capture the current value
      local current = x

      -- iterate through functions for this key
      for _, fn in ipairs(fns) do
        local result = fn(current)
        if result ~= nil then
          -- if there is a result from this function
          -- update the current value with the result
          current = result
        end
      end

      -- return result from calling the functions
      return current
    end
  end
  return combinedFilters
end

function inlinesToString(inlines)
  return pandoc.utils.stringify(pandoc.Span(inlines))
end

-- lua string to pandoc inlines
function stringToInlines(str)
  if str then
    return pandoc.List({pandoc.Str(str)})
  else
    return pandoc.List({})
  end
end

-- lua string with markdown to pandoc inlines
function markdownToInlines(str)
  if str then
    local doc = pandoc.read(str)
    return doc.blocks[1].content
  else
    return pandoc.List()
  end
end

function stripTrailingSpace(inlines)
  if #inlines > 0 then
    if inlines[#inlines].t == "Space" then
      return pandoc.List(tslice(inlines, 1, #inlines - 1))
    else
      return inlines
    end
  else
    return inlines
  end
end

-- non-breaking space
function nbspString()
  return pandoc.Str '\u{a0}'
end

-- the first heading in a div is sometimes the caption
function resolveHeadingCaption(div) 
  local capEl = div.content[1]
  if capEl ~= nil and capEl.t == 'Header' then
    div.content:remove(1)
    return capEl.content
  else 
    return nil
  end
end

local kBlockTypes = {
  "BlockQuote",
  "BulletList", 
  "CodeBlock ",
  "DefinitionList",
  "Div",
  "Header",
  "HorizontalRule",
  "LineBlock",
  "Null",
  "OrderedList",
  "Para",
  "Plain",
  "RawBlock",
  "Table"
}

function isBlockEl(el)
  return tcontains(kBlockTypes, el.t)
end

function isInlineEl(el)
  return not isBlockEl(el)
end

function compileTemplate(template, meta)
  local f = io.open(pandoc.utils.stringify(template), "r")
  if f then
    local contents = f:read("*all")
    f:close()
    -- compile the title block template
    local compiledTemplate = pandoc.template.compile(contents)
    local template_opts = pandoc.WriterOptions {template = compiledTemplate}  

    -- render the current document and read it to generate an AST for the
    -- title block
    local metaDoc = pandoc.Pandoc(pandoc.Blocks({}), meta)
    local rendered = pandoc.write(metaDoc, 'gfm', template_opts)

    -- read the rendered document 
    local renderedDoc = pandoc.read(rendered, 'gfm')

    return renderedDoc.blocks
  else
    fail('Error compiling template: ' .. template)
  end
end


-- latex.lua
-- Copyright (C) 2020 by RStudio, PBC

-- generates a set of options for a tColorBox
function tColorOptions(options) 

  local optionStr = ""
  local prepend = false
  for k, v in pairs(options) do
    if (prepend) then 
      optionStr = optionStr .. ', '
    end
    if v ~= "" then
      optionStr = optionStr .. k .. '=' .. v
    else
      optionStr = optionStr .. k
    end
    prepend = true
  end
  return optionStr

end

---@diagnostic disable: undefined-field
--[[

 base64 -- v1.5.3 public domain Lua base64 encoder/decoder
 no warranty implied; use at your own risk

 Needs bit32.extract function. If not present it's implemented using BitOp
 or Lua 5.3 native bit operators. For Lua 5.1 fallbacks to pure Lua
 implementation inspired by Rici Lake's post:
   http://ricilake.blogspot.co.uk/2007/10/iterating-bits-in-lua.html

 author: Ilya Kolbin (iskolbin@gmail.com)
 url: github.com/iskolbin/lbase64

 COMPATIBILITY

 Lua 5.1+, LuaJIT

 LICENSE

 See end of file for license information.

--]]


local extract = _G.bit32 and _G.bit32.extract -- Lua 5.2/Lua 5.3 in compatibility mode
if not extract then
	if _G.bit then -- LuaJIT
		local shl, shr, band = _G.bit.lshift, _G.bit.rshift, _G.bit.band
		extract = function( v, from, width )
			return band( shr( v, from ), shl( 1, width ) - 1 )
		end
	elseif _G._VERSION == "Lua 5.1" then
		extract = function( v, from, width )
			local w = 0
			local flag = 2^from
			for i = 0, width-1 do
				local flag2 = flag + flag
				if v % flag2 >= flag then
					w = w + 2^i
				end
				flag = flag2
			end
			return w
		end
	else -- Lua 5.3+
		extract = load[[return function( v, from, width )
			return ( v >> from ) & ((1 << width) - 1)
		end]]()
	end
end


function base64_makeencoder( s62, s63, spad )
	local encoder = {}
	for b64code, char in pairs{[0]='A','B','C','D','E','F','G','H','I','J',
		'K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y',
		'Z','a','b','c','d','e','f','g','h','i','j','k','l','m','n',
		'o','p','q','r','s','t','u','v','w','x','y','z','0','1','2',
		'3','4','5','6','7','8','9',s62 or '+',s63 or'/',spad or'='} do
		encoder[b64code] = char:byte()
	end
	return encoder
end

function base64_makedecoder( s62, s63, spad )
	local decoder = {}
	for b64code, charcode in pairs( base64_makeencoder( s62, s63, spad )) do
		decoder[charcode] = b64code
	end
	return decoder
end

local DEFAULT_ENCODER = base64_makeencoder()
local DEFAULT_DECODER = base64_makedecoder()

local char, concat = string.char, table.concat

function base64_encode( str, encoder, usecaching )
	encoder = encoder or DEFAULT_ENCODER
	local t, k, n = {}, 1, #str
	local lastn = n % 3
	local cache = {}
	for i = 1, n-lastn, 3 do
		local a, b, c = str:byte( i, i+2 )
		local v = a*0x10000 + b*0x100 + c
		local s
		if usecaching then
			s = cache[v]
			if not s then
				s = char(encoder[extract(v,18,6)], encoder[extract(v,12,6)], encoder[extract(v,6,6)], encoder[extract(v,0,6)])
				cache[v] = s
			end
		else
			s = char(encoder[extract(v,18,6)], encoder[extract(v,12,6)], encoder[extract(v,6,6)], encoder[extract(v,0,6)])
		end
		t[k] = s
		k = k + 1
	end
	if lastn == 2 then
		local a, b = str:byte( n-1, n )
		local v = a*0x10000 + b*0x100
		t[k] = char(encoder[extract(v,18,6)], encoder[extract(v,12,6)], encoder[extract(v,6,6)], encoder[64])
	elseif lastn == 1 then
		local v = str:byte( n )*0x10000
		t[k] = char(encoder[extract(v,18,6)], encoder[extract(v,12,6)], encoder[64], encoder[64])
	end
	return concat( t )
end

function base64_decode( b64, decoder, usecaching )
	decoder = decoder or DEFAULT_DECODER
	local pattern = '[^%w%+%/%=]'
	if decoder then
		local s62, s63
		for charcode, b64code in pairs( decoder ) do
			if b64code == 62 then s62 = charcode
			elseif b64code == 63 then s63 = charcode
			end
		end
		pattern = ('[^%%w%%%s%%%s%%=]'):format( char(s62), char(s63) )
	end
	b64 = b64:gsub( pattern, '' )
	local cache = usecaching and {}
	local t, k = {}, 1
	local n = #b64
	local padding = b64:sub(-2) == '==' and 2 or b64:sub(-1) == '=' and 1 or 0
	for i = 1, padding > 0 and n-4 or n, 4 do
		local a, b, c, d = b64:byte( i, i+3 )
		local s
		if usecaching then
			local v0 = a*0x1000000 + b*0x10000 + c*0x100 + d
			s = cache[v0]
			if not s then
				local v = decoder[a]*0x40000 + decoder[b]*0x1000 + decoder[c]*0x40 + decoder[d]
				s = char( extract(v,16,8), extract(v,8,8), extract(v,0,8))
				cache[v0] = s
			end
		else
			local v = decoder[a]*0x40000 + decoder[b]*0x1000 + decoder[c]*0x40 + decoder[d]
			s = char( extract(v,16,8), extract(v,8,8), extract(v,0,8))
		end
		t[k] = s
		k = k + 1
	end
	if padding == 1 then
		local a, b, c = b64:byte( n-3, n-1 )
		local v = decoder[a]*0x40000 + decoder[b]*0x1000 + decoder[c]*0x40
		t[k] = char( extract(v,16,8), extract(v,8,8))
	elseif padding == 2 then
		local a, b = b64:byte( n-3, n-2 )
		local v = decoder[a]*0x40000 + decoder[b]*0x1000
		t[k] = char( extract(v,16,8))
	end
	return concat( t )
end

--[[
------------------------------------------------------------------------------
This software is available under 2 licenses -- choose whichever you prefer.
------------------------------------------------------------------------------
ALTERNATIVE A - MIT License
Copyright (c) 2018 Ilya Kolbin
Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
------------------------------------------------------------------------------
ALTERNATIVE B - Public Domain (www.unlicense.org)
This is free and unencumbered software released into the public domain.
Anyone is free to copy, modify, publish, use, compile, sell, or distribute this
software, either in source code form or as a compiled binary, for any purpose,
commercial or non-commercial, and by any means.
In jurisdictions that recognize copyright laws, the author or authors of this
software dedicate any and all copyright interest in the software to the public
domain. We make this dedication for the benefit of the public at large and to
the detriment of our heirs and successors. We intend this dedication to be an
overt act of relinquishment in perpetuity of all present and future rights to
this software under copyright law.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
------------------------------------------------------------------------------
--]]

-- columns-preprocess.lua
-- Copyright (C) 2021 by RStudio, PBC

function columnsPreprocess() 
  return {
    Div = function(el)  
      
      if el.attr.classes:includes('cell') then      
        -- for code chunks that aren't layout panels, forward the column classes to the output
        -- figures or tables (otherwise, the column class should be used to layout the whole panel)
        resolveColumnClassesForCodeCell(el)
      else
        resolveColumnClassesForEl(el)
      end      
      return el      
    end,

    Para = function(el)
      local figure = discoverFigure(el, false)
      if figure then
        resolveElementForScopedColumns(figure, 'fig')
      end
      return el
    end  
  }
end

-- resolves column classes for an element
function resolveColumnClassesForEl(el) 
  -- ignore sub figures and sub tables
  if not hasRefParent(el) then    
    if hasFigureRef(el) then
      resolveElementForScopedColumns(el, 'fig')
    elseif hasTableRef(el) then
      resolveElementForScopedColumns(el, 'tbl')
    end
  end
end

-- forward column classes from code chunks onto their display / outputs
function resolveColumnClassesForCodeCell(el) 

  -- read the classes that should be forwarded
  local figClasses = computeClassesForScopedColumns(el, 'fig')
  local tblClasses = computeClassesForScopedColumns(el, 'tbl')
  local figCaptionClasses = computeClassesForScopedCaption(el, 'fig')
  local tblCaptionClasses = computeClassesForScopedCaption(el, 'tbl')

  if #tblClasses > 0 or #figClasses > 0 or #figCaptionClasses > 0 or #tblCaptionClasses > 0 then 
    noteHasColumns()
    
    if hasLayoutAttributes(el) then
      -- This is a panel, don't resolve any internal classes, only resolve 
      -- actually column classes for this element itself
      resolveColumnClassesForEl(el)
    else
      -- Forward the column classes inside code blocks
      for i, childEl in ipairs(el.content) do 
        if childEl.attr ~= nil and childEl.attr.classes:includes('cell-output-display') then

          -- look through the children for any figures or tables
          local forwarded = false
          for j, figOrTableEl in ipairs(childEl.content) do
            local figure = discoverFigure(figOrTableEl, false)
            if figure ~= nil then
              -- forward to figures
              applyClasses(figClasses, figCaptionClasses, el, childEl, figure, 'fig')
              forwarded = true
            elseif figOrTableEl.attr ~= nil and hasFigureRef(figOrTableEl) then
              -- forward to figure divs
              applyClasses(figClasses, figCaptionClasses, el, childEl, figOrTableEl, 'fig')
              forwarded = true
            elseif (figOrTableEl.t == 'Div' and hasTableRef(figOrTableEl)) then
              -- for a table div, apply the classes to the figOrTableEl itself
              applyClasses(tblClasses, tblCaptionClasses, el, childEl, figOrTableEl, 'tbl')
              forwarded = true
            elseif figOrTableEl.t == 'Table' then
              -- the figOrTableEl is a table, just apply the classes to the div around it
              applyClasses(tblClasses, tblCaptionClasses, el, childEl, childEl, 'tbl')
              forwarded = true
            end
          end

          -- no known children were discovered, apply the column classes to the cell output display itself
          if not forwarded then 
            
            -- figure out whether there are tables inside this element
            -- if so, use tbl scope, otherwise treat as a fig
            local tableCount = countTables(el)
            local scope = 'fig'
            if tableCount > 0 then
              scope = 'tbl'
            end

            -- forward the classes from the proper scope onto the cell-output-display div
            local colClasses = computeClassesForScopedColumns(el, scope)
            local capClasses = computeClassesForScopedCaption(el, scope)
            applyClasses(colClasses, capClasses, el, childEl, childEl, scope)

          end
        end
      end
    end
  end         
end

function applyClasses(colClasses, captionClasses, containerEl, colEl, captionEl, scope)
  if #colClasses > 0 then
    applyColumnClasses(colEl, colClasses, scope)
    clearColumnClasses(containerEl, scope)
  end
  if #captionClasses > 0 then
    applyCaptionClasses(captionEl, captionClasses, scope)
    clearCaptionClasses(containerEl, scope)
  end
end

function resolveElementForScopedColumns(el, scope) 
  local classes = computeClassesForScopedColumns(el, scope)
  if #classes > 0 then
    applyColumnClasses(el, classes, scope)
  end

  local captionClasses = computeClassesForScopedCaption(el, scope)
  if #captionClasses > 0 then
    applyCaptionClasses(el, captionClasses, scope)
  end
end

function clearColumnClasses(el, scope)
  removeColumnClasses(el)
  if scope ~= nil then
    removeScopedColumnClasses(el, scope)
  end
end

function clearCaptionClasses(el, scope) 
  removeCaptionClasses(el)
  if scope ~= nil then
    removeScopedCaptionClasses(el, scope)
  end
end

function applyCaptionClasses(el, classes, scope)
  -- note that we applied a column class
  noteHasColumns()

  -- clear existing columns
  removeCaptionClasses(el)
  if scope ~= nil then
    removeScopedCaptionClasses(el, scope)
  end

  -- write the resolve scopes
  tappend(el.attr.classes, classes)
end

function applyColumnClasses(el, classes, scope) 
  -- note that we applied a column class
  noteHasColumns()

  -- clear existing columns
  removeColumnClasses(el)
  if scope ~= nil then
    removeScopedColumnClasses(el, scope)
  end

  -- write the resolve scopes
  tappend(el.attr.classes, classes)
end

function computeClassesForScopedCaption(el, scope)
  local globalCaptionClasses = captionOption('cap-location')
  local elCaptionClasses = resolveCaptionClasses(el)
  local orderedCaptionClasses = {elCaptionClasses, globalCaptionClasses}

  -- if a scope has been provided, include that
  if scope ~= nil then
    local elScopedCaptionClasses = resolveScopedCaptionClasses(el, scope)
    local scopedCaptionClasses = captionOption(scope .. '-cap-location')
    tprepend(orderedCaptionClasses, {elScopedCaptionClasses, scopedCaptionClasses})
  end

  for i, classes in ipairs(orderedCaptionClasses) do 
    if #classes > 0 then
      return classes
    end
  end
  return {}
end

-- Computes the classes for a given element, given its scope
function computeClassesForScopedColumns(el, scope) 
  local columnGlobalClasses = columnOption('column')
  local columnElClasses = resolveColumnClasses(el)
  local orderedClasses = {columnElClasses, columnGlobalClasses}

  -- if a scope has been provided, include that
  if scope ~= nil then
    local scopedGlobalClasses = columnOption(scope .. '-column')
    local scopedElClasses = resolveScopedColumnClasses(el, scope)
    tprepend(orderedClasses, {scopedElClasses, scopedGlobalClasses})
  end
  
  for i, classes in ipairs(orderedClasses) do 
    if #classes > 0 then
      return classes
    end
  end
  return {}
end

-- reads a column option key and returns the value
-- as a table of strings 
function columnOption(key) 
  local value = option(key,  nil)
  if value == nil or #value < 1 then
    return {}
  else
    return {'column-' .. inlinesToString(value[1])}
  end
end

function captionOption(key)
  local value = option(key,  nil)
  if value ~= nil then
  end
  if value ~= nil and value[1].text == 'margin' then
    return {'margin-caption'}
  else
    return {}
  end
end

function mergedScopedColumnClasses(el, scope)
  local scopedClasses = resolveScopedColumnClasses(el, scope)
  if #scopedClasses == 0 then
    scopedClasses = scopedColumnClassesOption(scope)
  end
  return scopedClasses
end

function resolveScopedColumnClasses(el, scope)
  local filtered = el.attr.classes:filter(function(clz)
    return clz:match('^' .. scope .. '%-column%-')
  end)

  return tmap(filtered, function(clz)
    return clz:sub(5)
  end)
end

function resolveScopedCaptionClasses(el, scope)
  local filtered = el.attr.classes:filter(function(clz)
    return clz:match('^' .. scope .. '%-cap%-location%-')
  end)

  local mapped = tmap(filtered, function(clz)
    return clz:sub(18)
  end)
  
  if tcontains(mapped, 'margin') then
    return {'margin-caption'}
  else 
    return {}
  end
end

function removeScopedColumnClasses(el, scope) 
  for i, clz in ipairs(el.attr.classes) do 
    if clz:match('^' .. scope .. '%-column%-') then
      el.attr.classes:remove(i)
    end
  end
end

function removeScopedCaptionClasses(el, scope)
  for i, clz in ipairs(el.attr.classes) do 
    if clz:match('^' .. scope .. '%-cap%-location%-') then
      el.attr.classes:remove(i)
    end
  end  
end

function scopedColumnClassesOption(scope) 
  local clz = option(scope .. '-column', nil);
  if clz == nil then
    clz = option('column',  nil)
  end
  local column = columnToClass(clz)
  if column then
    return {column}
  else
    return {}
  end
end

-- options.lua
-- Copyright (C) 2020 by RStudio, PBC

local allOptions = {}

-- initialize options from 'crossref' metadata value
function initOptions()
  return {
    Meta = function(meta)
      if meta ~= nil then
        allOptions = readMetaOptions(meta)
      end
    end
  }
end

-- get option value
function option(name, def)
  local val = allOptions[name]
  if val == nil then
    return def
  else
    return val
  end
end

function capLocation(scope, default)
  local loc = option(scope .. '-cap-location', option('cap-location', nil))
  if loc ~= nil then
    return inlinesToString(loc)
  else
    return default
  end
end


-- columns.lua
-- Copyright (C) 2021 by RStudio, PBC


kSideCaptionClass = 'margin-caption'

function columns() 
  
  return {

    Div = function(el)  
      -- for any top level divs, render then
      renderDivColumn(el)
      return el      
    end,

    Span = function(el)
      -- a span that should be placed in the margin
      if _quarto.format.isLatexOutput() and hasMarginColumn(el) then 
        noteHasColumns()
        tprepend(el.content, {latexBeginSidenote(false)})
        tappend(el.content, {latexEndSidenote(el, false)})
        return el
      else 
        -- convert the aside class to a column-margin class
        if el.attr.classes and tcontains(el.attr.classes, 'aside') then
          noteHasColumns()
          el.attr.classes = el.attr.classes:filter(function(attr) 
            return attr ~= "aside"
          end)
          tappend(el.attr.classes, {'column-margin'})
          return el
        end
      end
    end,

    RawBlock = function(el) 
      -- Implements support for raw <aside> tags and replaces them with
      -- our raw latex representation
      if _quarto.format.isLatexOutput() then
        if el.format == 'html' then
          if el.text == '<aside>' then 
            noteHasColumns()
            el = latexBeginSidenote()
          elseif el.text == '</aside>' then
            el = latexEndSidenote(el)
          end
        end
      end
      return el
    end
  }
end

function renderDivColumn(el) 

  -- for html output that isn't reveal...
  if _quarto.format.isHtmlOutput() and not _quarto.format.isHtmlSlideOutput() then

    -- For HTML output, note that any div marked an aside should
    -- be marked a column-margin element (so that it is processed 
    -- by post processors). 
    -- For example: https://github.com/quarto-dev/quarto-cli/issues/2701
    if el.attr.classes and tcontains(el.attr.classes, 'aside') then
      noteHasColumns()
      el.attr.classes = el.attr.classes:filter(function(attr) 
        return attr ~= "aside"
      end)
      tappend(el.attr.classes, {'column-margin'})
      return el
    end

  elseif el.identifier and el.identifier:find("^lst%-") then
    -- for listings, fetch column classes from sourceCode element
    -- and move to the appropriate spot (e.g. caption, container div)
    local captionEl = el.content[1]
    local codeEl = el.content[2]
    
    if captionEl and codeEl then
      local columnClasses = resolveColumnClasses(codeEl)
      if #columnClasses > 0 then
        noteHasColumns()
        removeColumnClasses(codeEl)

        for i, clz in ipairs(columnClasses) do 
          if clz == kSideCaptionClass and _quarto.format.isHtmlOutput() then
            -- wrap the caption if this is a margin caption
            -- only do this for HTML output since Latex captions typically appear integrated into
            -- a tabular type layout in latex documents
            local captionContainer = pandoc.Div({captionEl}, pandoc.Attr("", {clz}))
            el.content[1] = codeEl
            el.content[2] = captionContainer    
          else
            -- move to container
            el.attr.classes:insert(clz)
          end
        end
      end
    end

  elseif _quarto.format.isLatexOutput() and not requiresPanelLayout(el) then

    -- see if there are any column classes
    local columnClasses = resolveColumnClasses(el)
    if #columnClasses > 0 then
      noteHasColumns() 
      
      if el.attr.classes:includes('cell-output-display') and #el.content > 0 then
        -- this could be a code-display-cell
        local figOrTable = false
        for j=1,#el.content do
          local contentEl = el.content[j]

          -- wrap figures
          local figure = discoverFigure(contentEl, false)
          if figure ~= nil then
            applyFigureColumns(columnClasses, figure)
            figOrTable = true
          elseif contentEl.t == 'Div' and hasTableRef(contentEl) then
            -- wrap table divs
            latexWrapEnvironment(contentEl, latexTableEnv(el), false)
            figOrTable = true
          elseif contentEl.attr ~= nil and hasFigureRef(contentEl) then
            -- wrap figure divs
            latexWrapEnvironment(contentEl, latexFigureEnv(el), false)
            figOrTable = true
          elseif contentEl.t == 'Table' then
            -- wrap the table in a div and wrap the table environment around it
            local tableDiv = pandoc.Div({contentEl})
            latexWrapEnvironment(tableDiv, latexTableEnv(el), false)
            el.content[j] = tableDiv
            figOrTable = true
          end 
        end

        if not figOrTable then
          processOtherContent(el.content)
        end
      else

        
        -- this is not a code cell so process it
        if el.attr ~= nil then
          if hasTableRef(el) then
            latexWrapEnvironment(el, latexTableEnv(el), false)
          elseif hasFigureRef(el) then
            latexWrapEnvironment(el, latexFigureEnv(el), false)
          else
            -- Look in the div to see if it contains a figure
            local figure = nil
            for j=1,#el.content do
              local contentEl = el.content[j]
              if figure == nil then
                figure = discoverFigure(contentEl, false)
              end
            end
            if figure ~= nil then
              applyFigureColumns(columnClasses, figure)
            else
              processOtherContent(el)
            end
          end
        end
      end   
    else 
       -- Markup any captions for the post processor
      latexMarkupCaptionEnv(el);
    end
  end
end

function processOtherContent(el)
  if hasMarginColumn(el) then
    -- (margin notes)
    noteHasColumns()
    tprepend(el.content, {latexBeginSidenote()});
    tappend(el.content, {latexEndSidenote(el)})
  else 
    -- column classes, but not a table or figure, so 
    -- handle appropriately
    local otherEnv = latexOtherEnv(el)
    if otherEnv ~= nil then
      latexWrapEnvironment(el, otherEnv, false)
    end
  end
  removeColumnClasses(el)
end

function applyFigureColumns(columnClasses, figure)
  -- just ensure the classes are - they will be resolved
  -- when the latex figure is rendered
  addColumnClasses(columnClasses, figure)

  -- ensure that extended figures will render this
  forceExtendedFigure(figure)  
end
  

function hasColumnClasses(el) 
  return tcontains(el.attr.classes, isColumnClass) or hasMarginColumn(el)
end

function hasMarginColumn(el)
  if el.attr ~= nil and el.attr.classes ~= nil then
    return tcontains(el.attr.classes, 'column-margin') or tcontains(el.attr.classes, 'aside')
  else
    return false
  end
end

function hasMarginCaption(el)
  if el.attr ~= nil and el.attr.classes ~= nil then
    return tcontains(el.attr.classes, 'margin-caption')
  else
    return false
  end
end

function noteHasColumns() 
  layoutState.hasColumns = true
end

function notColumnClass(clz) 
  return not isColumnClass(clz)
end

function resolveColumnClasses(el) 
  return el.attr.classes:filter(isColumnClass)
end

function columnToClass(column)
  if column ~= nil then
    return 'column-' .. column[1].text
  else
    return nil
  end
end

function removeColumnClasses(el)
  if el.attr and el.attr.classes then
    for i, clz in ipairs(el.attr.classes) do 
      if isColumnClass(clz) then
        el.attr.classes:remove(i)
      end
    end  
  end
end

function addColumnClasses(classes, toEl) 
  removeColumnClasses(toEl)
  for i, clz in ipairs(classes) do 
    if isColumnClass(clz) then
      toEl.attr.classes:insert(clz)
    end
  end  
end

function removeCaptionClasses(el)
  for i, clz in ipairs(el.attr.classes) do 
    if isCaptionClass(clz) then
      el.attr.classes:remove(i)
    end
  end
end

function resolveCaptionClasses(el)
  local filtered = el.attr.classes:filter(isCaptionClass)
  if #filtered > 0 then
    return {'margin-caption'}
  else
    return {}
  end
end

function isCaptionClass(clz)
  return clz == 'caption-margin' or clz == 'margin-caption'
end

function isColumnClass(clz) 
  if clz == nil then
    return false
  elseif clz == 'aside' then
    return true
  else
    return clz:match('^column%-')
  end
end

-- cites.lua
-- Copyright (C) 2021 by RStudio, PBC
  

function citesPreprocess() 
  return {
    
    Note = function(note) 
      if _quarto.format.isLatexOutput() and marginCitations() then
        return pandoc.walk_inline(note, {
          Inlines = walkUnresolvedCitations(function(citation, appendInline, appendAtEnd)
            appendAtEnd(citePlaceholderInline(citation))
          end)
        })
      end
    end,

    Para = function(para)
      local figure = discoverFigure(para, true)
      if figure and _quarto.format.isLatexOutput() and hasFigureRef(figure) then
        if hasMarginColumn(figure) or hasMarginCaption(figure) then
          -- This is a figure in the margin itself, we need to append citations at the end of the caption
          -- without any floating
          para.content[1] = pandoc.walk_inline(figure, {
              Inlines = walkUnresolvedCitations(function(citation, appendInline, appendAtEnd)
                appendAtEnd(citePlaceholderInlineWithProtection(citation))
              end)
            })
          return para
        elseif marginCitations() then
          -- This is a figure is in the body, but the citation should be in the margin. Use 
          -- protection to shift any citations over
          para.content[1] = pandoc.walk_inline(figure, {
            Inlines = walkUnresolvedCitations(function(citation, appendInline, appendAtEnd)
              appendInline(marginCitePlaceholderWithProtection(citation))
            end)
          })
          return para
        end   
      end
    end,

    Div = function(div)
      if _quarto.format.isLatexOutput() and hasMarginColumn(div) or marginCitations() then
        if hasTableRef(div) then 
          -- inspect the table caption for refs and just mark them as resolved
          local table = discoverTable(div)
          if table ~= nil and table.caption ~= nil and table.caption.long ~= nil then
            local cites = false
            -- go through any captions and resolve citations into latex
            for i, caption in ipairs(table.caption.long) do
              cites = resolveCaptionCitations(caption.content, hasMarginColumn(div)) or cites
            end
            if cites then
              return div
            end
          end  
        else
          return pandoc.walk_block(div, {
            Inlines = walkUnresolvedCitations(function(citation, appendInline, appendAtEnd)
              if hasMarginColumn(div) then
                appendAtEnd(citePlaceholderInline(citation))
              end
            end)
          })
        end 

      end
    end
    
  }
end

function cites() 
  return {
    -- go through inlines and resolve any unresolved citations
    Inlines = walkUnresolvedCitations(function(citation, appendInline)
      appendInline(marginCitePlaceholderInline(citation))
    end)
  }
end

function walkUnresolvedCitations(func)
  return function(inlines)
    local modified = false
    if _quarto.format.isLatexOutput() and marginCitations() then
      for i,inline in ipairs(inlines) do
        if inline.t == 'Cite' then
          for j, citation in ipairs(inline.citations) do
            if not isResolved(citation) then
              func(
                citation, 
                function(inlineToAppend)
                  if inlineToAppend ~= nil then
                    local inlinePos = i
                    local citationCount = j                  
                    inlines:insert(inlinePos+citationCount, inlineToAppend)
                    modified = true
                    setResolved(citation)
                  end
                end,
                function(inlineToAppendAtEnd)
                  if inlineToAppendAtEnd ~= nil then
                    inlines:insert(#inlines + 1, inlineToAppendAtEnd)
                    modified = true
                    setResolved(citation)
                  end
                end
            )
            end  
          end
        end
      end
    end
    if modified then
      return inlines  
    end    
  end
end

function resolveCaptionCitations(captionContentInlines, inMargin)
  local citeEls = pandoc.List()
  for i,inline in ipairs(captionContentInlines) do
    if inline.t == 'Cite' then
      for j, citation in ipairs(inline.citations) do
        if inMargin then
          citeEls:insert(citePlaceholderInlineWithProtection(citation))
        else
          citeEls:insert(marginCitePlaceholderWithProtection(citation))
        end
        setResolved(citation)
      end
    end
  end

  if #citeEls > 0 then
    tappend(captionContentInlines, citeEls)
    return true
  else
    return false
  end
end

function marginCitePlaceholderInline(citation)
  return pandoc.RawInline('latex', '\\marginpar{\\begin{footnotesize}{?quarto-cite:'.. citation.id .. '}\\vspace{2mm}\\par\\end{footnotesize}}')
end

function citePlaceholderInline(citation)
  return pandoc.RawInline('latex', '\\linebreak\\linebreak{?quarto-cite:'.. citation.id .. '}\\linebreak')
end

function citePlaceholderInlineWithProtection(citation)
  return pandoc.RawInline('latex', '\\linebreak\\linebreak\\protect{?quarto-cite:'.. citation.id .. '}\\linebreak')
end

function marginCitePlaceholderWithProtection(citation)
  return pandoc.RawInline('latex', '\\protect\\marginnote{\\begin{footnotesize}\\protect{?quarto-cite:'.. citation.id .. '}\\linebreak\\end{footnotesize}}')
end

local resolvedCites = {}

function keyForCite(citation) 
  local id = citation.id
  local num = citation.note_num
  local key = id .. num
  return key
end

-- need a way to communicate that this has been resolved
function setResolved(citation)
  resolvedCites[keyForCite(citation)] = true
end

function isResolved(citation)
  return resolvedCites[keyForCite(citation)] == true
end

function discoverTable(div) 
  local tbl = div.content[1]
  if tbl.t == 'Table' then
    return tbl
  else
    return nil
  end
end

-- figures.lua
-- Copyright (C) 2020 by RStudio, PBC

-- extended figure features including fig-align, fig-env, etc.
function extendedFigures() 
  return {
    
    Para = function(el)
      local image = discoverFigure(el, false)
      if image and shouldHandleExtendedImage(image) then
        if _quarto.format.isHtmlOutput() then
          return htmlImageFigure(image)
        elseif _quarto.format.isLatexOutput() then
          return latexImageFigure(image)
        elseif _quarto.format.isDocxOutput() then
          return wpDivFigure(createFigureDiv(el, image))
        end
      end
    end,
    
    Div = function(el)
      if isFigureDiv(el) and shouldHandleExtended(el) then
        if _quarto.format.isLatexOutput() then
          return latexDivFigure(el)
        elseif _quarto.format.isHtmlOutput() then
          return htmlDivFigure(el)
        elseif _quarto.format.isDocxOutput() then
          return wpDivFigure(el)
        end
      end
    end
    
  }
end

local kFigExtended = "fig.extended"

function preventExtendedFigure(el)
  el.attr.attributes[kFigExtended] = "false"
end

function forceExtendedFigure(el) 
  el.attr.attributes[kFigExtended] = "true"
end

function shouldHandleExtended(el)
  return el.attr.attributes[kFigExtended] ~= "false"
end

-- By default, images without captions should be
-- excluded from extended processing. 
function shouldHandleExtendedImage(el) 
  -- handle extended if there is a caption
  if el.caption and #el.caption > 0 then
    return true
  end

  -- handle extended if there are fig- attributes
  local keys = tkeys(el.attr.attributes)
  for _,k in pairs(keys) do
    if isFigAttribute(k) then
      return true
    end
  end

  -- handle extended if there is column or caption 
  -- classes
  if hasColumnClasses(el) then
    return true
  end

  -- handle extended if it was explicitly enabled
  if el.attr.attributes[kFigExtended] == "true" then
    return true
  end

  -- otherwise, by default, do not handle
  return false
end

-- table.lua
-- Copyright (C) 2020 by RStudio, PBC

function tablePanel(divEl, layout, caption, options)
  
  -- empty options by default
  if not options then
    options = {}
  end
  
  -- create panel
  local panel = pandoc.Div({})
  
  -- layout
  for i, row in ipairs(layout) do
    
    local aligns = row:map(function(cell) 
      
      -- get the align
      local align = cell.attr.attributes[kLayoutAlign]
      
      -- in docx tables inherit their parent cell alignment (likely a bug) so 
      -- this alignment will force all columns in embedded tables to follow it.
      -- if the alignment is center this won't make for very nice tables, so
      -- we force it to pandoc.AlignDefault
      if tableFromLayoutCell(cell) and _quarto.format.isDocxOutput() and align == "center" then
        return pandoc.AlignDefault
      else
        return layoutTableAlign(align) 
      end
    end)
    local widths = row:map(function(cell) 
      -- propagage percents if they are provided
      local layoutPercent = horizontalLayoutPercent(cell)
      if layoutPercent then
        return layoutPercent / 100
      else
        return 0
      end
    end)

    local cells = pandoc.List()
    for _, cell in ipairs(row) do
      local align = cell.attr.attributes[kLayoutAlign]
      cells:insert(tableCellContent(cell, align, options))
    end
    
    -- make the table
    local panelTable = pandoc.SimpleTable(
      pandoc.List(), -- caption
      aligns,
      widths,
      pandoc.List(), -- headers
      { cells }
    )
    
    -- add it to the panel
    panel.content:insert(pandoc.utils.from_simple_table(panelTable))
    
    -- add empty text frame (to prevent a para from being inserted btw the rows)
    if i ~= #layout and options.rowBreak then
      panel.content:insert(options.rowBreak())
    end
  end
  
  -- insert caption
  if caption then
    if options.divCaption then
      caption = options.divCaption(caption)
    end
     panel.content:insert(caption)
  end

  -- return panel
  return panel
end


function tableCellContent(cell, align, options)
  
  -- there will be special code if this an image or table
  local image = figureImageFromLayoutCell(cell)
  local tbl = tableFromLayoutCell(cell)
  local isSubRef = hasRefParent(cell) or (image and hasRefParent(image))
 
  if image then
    -- convert layout percent to physical units (if we have a pageWidth)
    -- this ensures that images don't overflow the column as they have
    -- been observed to do in docx
    if options.pageWidth then
      local layoutPercent = horizontalLayoutPercent(cell)
      if layoutPercent then
        local inches = (layoutPercent/100) * options.pageWidth
        image.attr.attributes["width"] = string.format("%2.2f", inches) .. "in"
      end
    end
    
    -- rtf and odt don't write captions in tables so make this explicit
    if #image.caption > 0 and (_quarto.format.isRtfOutput() or _quarto.format.isOdtOutput()) then
      local caption = image.caption:clone()
      tclear(image.caption)
      local captionPara = pandoc.Para(caption)
      if options.divCaption then
        captionPara = options.divCaption(captionPara, align)
      end
      cell.content:insert(captionPara)
    end
    
    -- we've already aligned the image in a table cell so prevent 
    -- extended handling as it would create a nested table cell
    preventExtendedFigure(image)
  end
  
  if hasFigureRef(cell) then
    -- style div caption if there is a custom caption function
    if options.divCaption then
      local divCaption = options.divCaption(refCaptionFromDiv(cell), align)
      cell.content[#cell.content] = divCaption 
    end
    
    -- we've already aligned the figure in a table cell so prevent 
    -- extended handling as it would create a nested table cell
    preventExtendedFigure(cell)
  end
  
  if tbl then
    
   
    if align == "center" then
      
      -- force widths to occupy 100%
      layoutEnsureFullTableWidth(tbl)
      
      -- for docx output we've forced the alignment of this cell to AlignDefault
      -- above (see the comment in tablePanel for rationale). Forcing the 
      -- table to 100$% width (done right above) makes it appear "centered" so
      -- do the same for the caption
      if _quarto.format.isDocxOutput() then
        local caption = pandoc.utils.blocks_to_inlines(tbl.caption.long)
        tclear(tbl.caption.long)
        if tbl.caption.short then
          tclear(tbl.caption.short)
        end
        cell.content:insert(1, options.divCaption(pandoc.Para(caption), align))
      end
    end
    
    -- workaround issue w/ docx nested tables: https://github.com/jgm/pandoc/issues/6983
    if _quarto.format.isDocxOutput() then
      if PANDOC_VERSION < pandoc.types.Version("2.11.3.2") then
        cell.content:insert(options.rowBreak())
      end
    end
  end
 
  return { cell }
  
end


function layoutTableAlign(align)
  if align == "left" then
    return pandoc.AlignLeft
  elseif align == "center" then
    return pandoc.AlignCenter
  elseif align == "right" then
    return pandoc.AlignRight
  end
end

function layoutEnsureFullTableWidth(tbl)
  if not tbl.colspecs:find_if(function(spec) return spec.width ~= nil end) then
    tbl.colspecs = tbl.colspecs:map(function(spec)
      return { spec[1], (1 / #tbl.colspecs) * 0.98 }
    end)
  end
end



-- pptx.lua
-- Copyright (C) 2020 by RStudio, PBC


function pptxPanel(divEl, layout)
  
  -- create panel
  local panel = pandoc.Div({}, pandoc.Attr(divEl.attr.identifier, {"columns"}))
  
  -- add a column for each figure (max 2 columns will be displayed)
  local kMaxCols = 2
  for i, row in ipairs(layout) do
    for _, cell in ipairs(row) do
      -- break on kMaxCols
      if #panel.content == kMaxCols then
        break
      end
      
      -- add the column class
      cell.attr.classes:insert("column")
      
      -- add to the panel
      panel.content:insert(cell)
    end
  end
  
  -- return panel
  return panel
end


-- odt.lua
-- Copyright (C) 2020 by RStudio, PBC


function tableOdtPanel(divEl, layout, caption)
  return tablePanel(divEl, layout, caption, {
    pageWidth = wpPageWidth(),
    divCaption = odtDivCaption
  })
end

-- create a native odt caption (note that because "opendocument" paragraphs
-- include their styles as an attribute, we need to stringify the captionEl
-- so that it can be embedded in a raw opendocument block
function odtDivCaption(captionEl, align)
  local caption = pandoc.RawBlock("opendocument", 
    "<text:p text:style-name=\"FigureCaption\">" ..
    pandoc.utils.stringify(captionEl) .. 
    "</text:p>"
  )
  return caption
end




-- docx.lua
-- Copyright (C) 2020 by RStudio, PBC


function tableDocxPanel(divEl, layout, caption)
  return tablePanel(divEl, layout, caption, {
    pageWidth = wpPageWidth(),
    rowBreak = docxRowBreak,
    divCaption = docxDivCaption
  })
end


function docxRowBreak()
  return pandoc.RawBlock("openxml", [[
<w:p>
  <w:pPr>
    <w:framePr w:w="0" w:h="0" w:vAnchor="margin" w:hAnchor="margin" w:xAlign="right" w:yAlign="top"/>
  </w:pPr>
</w:p>
]])
end


-- create a native docx caption 
function docxDivCaption(captionEl, align)
  local caption = pandoc.Para({
    pandoc.RawInline("openxml", docxParaStyles(align))
  })
  tappend(caption.content, captionEl.content)
  return caption
end

function docxParaStyles(align)
  local styles = "<w:pPr>\n"
  local captionAlign = docxAlign(align)
  if captionAlign then
    styles = styles .. 
        "<w:jc w:val=\"" .. captionAlign .. "\"/>\n"
  end  
  styles = styles ..
    "<w:spacing w:before=\"200\" />\n" ..
    "<w:pStyle w:val=\"ImageCaption\" />\n" ..
    "</w:pPr>\n"
  return styles
end

function docxAlign(align)
  if align == "left" then
    return "start"
  elseif align == "center" then
    return "center"
  elseif align == "right" then
    return "end"
  else
    return nil
  end
end




-- wp.lua
-- Copyright (C) 2020 by RStudio, PBC


function tableWpPanel(divEl, layout, caption)
  return tablePanel(divEl, layout, caption, {
    pageWidth = wpPageWidth()
  })
end


function wpDivFigure(div)
  
  -- options
  options = {
    pageWidth = wpPageWidth(),
  }

  -- determine divCaption handler (always left-align)
  local divCaption = nil
  if _quarto.format.isDocxOutput() then
    divCaption = docxDivCaption
  elseif _quarto.format.isOdtOutput() then
    divCaption = odtDivCaption
  end
  if divCaption then
    options.divCaption = function(el, align) return divCaption(el, "left") end
  end

  -- get alignment
  local align = figAlignAttribute(div)
  
  -- create the row/cell for the figure
  local row = pandoc.List()
  local cell = div:clone()
  transferImageWidthToCell(div, cell)
  row:insert(tableCellContent(cell, align, options))
  
  -- make the table
  local figureTable = pandoc.SimpleTable(
    pandoc.List(), -- caption
    { layoutTableAlign(align) },  
    {   1   },         -- full width
    pandoc.List(), -- no headers
    { row }            -- figure
  )
  
  -- return it
  return pandoc.utils.from_simple_table(figureTable)
  
end

function wpPageWidth()
  local width = param("page-width", nil)
  if width then 
    if (type(width) == 'table') then
      width = tonumber(pandoc.utils.stringify(width))
    end

    if not width then
      error("You must use a number for page-width")
    else
      return width
    end
  else
    return 6.5
  end
end

-- html.lua
-- Copyright (C) 2020 by RStudio, PBC

function htmlPanel(divEl, layout, caption)
  
  -- outer panel to contain css and figure panel
  local divId = divEl.attr.identifier
  if divId == nil then
    divId = ''
  end

  local panel = pandoc.Div({}, pandoc.Attr(divId, divEl.attr.classes))
  panel.attr.classes:insert("quarto-layout-panel")
  
  -- enclose in figure if it's a figureRef
  if hasFigureRef(divEl) then
    panel.content:insert(pandoc.RawBlock("html", "<figure>"))
  end

  -- compute vertical alignment and remove attribute
  local vAlign = validatedVAlign(divEl.attr.attributes[kLayoutVAlign])
  local vAlignClass = vAlignClass(vAlign);
  divEl.attr.attributes[kLayoutVAlign] = nil
  
  -- layout
  for i, row in ipairs(layout) do
    
    local rowDiv = pandoc.Div({}, pandoc.Attr("", {"quarto-layout-row"}))

    -- add the vertical align element to this row
    if vAlignClass then
      rowDiv.attr.classes:insert(vAlignClass);
    end
  
    for i, cellDiv in ipairs(row) do
      
      -- add cell class
      cellDiv.attr.classes:insert("quarto-layout-cell")
      
      -- if it has a ref parent then give it another class
      -- (used to provide subcaption styling)
      if layoutCellHasRefParent(cellDiv) then
        cellDiv.attr.classes:insert("quarto-layout-cell-subref")
      end
      
      -- create css style for width
      local cellDivStyle = ""
      local width = cellDiv.attr.attributes["width"]
      local align = cellDiv.attr.attributes[kLayoutAlign]
      cellDiv.attr.attributes[kLayoutAlign] = nil
      cellDivStyle = cellDivStyle .. "flex-basis: " .. width .. ";"
      cellDiv.attr.attributes["width"] = nil
      local justify = flexAlign(align)
      cellDivStyle = cellDivStyle .. "justify-content: " .. justify .. ";"
      cellDiv.attr.attributes["style"] = cellDivStyle
      
      -- if it's a table then our table-inline style will cause table headers
      -- (th) to be centered. set them to left is they are default
      local tbl = tableFromLayoutCell(cellDiv)
      if tbl then
        tbl.colspecs = tbl.colspecs:map(function(spec)
          if spec[1] == pandoc.AlignDefault then
            spec[1] = pandoc.AlignLeft
          end
          return spec
        end)
      end
      
      -- add div to row
      rowDiv.content:insert(cellDiv)
    end
    
    -- add row to the panel
    panel.content:insert(rowDiv)
  end
  
  -- determine alignment
  local align = layoutAlignAttribute(divEl)
  divEl.attr.attributes[kLayoutAlign] = nil
  
  -- insert caption and </figure>
  if caption then
    if hasFigureRef(divEl) then
      local captionPara = pandoc.Para({})
      -- apply alignment if we have it
      local figcaption = "<figcaption>"
      captionPara.content:insert(pandoc.RawInline("html", figcaption))
      tappend(captionPara.content, caption.content)
      captionPara.content:insert(pandoc.RawInline("html", "</figcaption>"))
      if capLocation('fig', 'bottom') == 'bottom' then
        panel.content:insert(captionPara)
      else
        tprepend(panel.content, { captionPara })
      end
    else
      local panelCaption = pandoc.Div(caption, pandoc.Attr("", { "panel-caption" }))
      if hasTableRef(divEl) then
        panelCaption.attr.classes:insert("table-caption")
        if capLocation('tbl', 'top') == 'bottom' then
          panel.content:insert(panelCaption)
        else
          tprepend(panel.content, { panelCaption })
        end
      else
        panel.content:insert(panelCaption)
      end
    end
  end
  
  if hasFigureRef(divEl) then
    panel.content:insert(pandoc.RawBlock("html", "</figure>"))
  end
  
  -- return panel
  return panel
end

function htmlDivFigure(el)
  
  return renderHtmlFigure(el, function(figure)
    
    -- get figure
    local figure = tslice(el.content, 1, #el.content-1)

    -- get caption
    local caption = refCaptionFromDiv(el)
    if caption then
      caption = caption.content
    else
      caption = nil
    end

    return figure, caption    
  end)
  
end


function htmlImageFigure(image)

  return renderHtmlFigure(image, function(figure)
    
    -- make a copy of the caption and clear it
    local caption = image.caption:clone()
    tclear(image.caption)
   
    -- pandoc sometimes ends up with a fig prefixed title
    -- (no idea way right now!)
    if image.title == "fig:" or image.title == "fig-" then
      image.title = ""
    end
   
    -- insert the figure without the caption
    local figure = { pandoc.Para({image}) }
    

    return figure, caption
    
  end)
  
end


function renderHtmlFigure(el, render)

  -- capture relevant figure attributes then strip them
  local align = figAlignAttribute(el)
  local keys = tkeys(el.attr.attributes)
  for _,k in pairs(keys) do
    if isFigAttribute(k) then
      el.attr.attributes[k] = nil
    end
  end
  local figureAttr = {}
  local style = el.attr.attributes["style"]
  if style then
    figureAttr["style"] = style
    el.attributes["style"] = nil
  end

  -- create figure div (
  local figureDiv = pandoc.Div({}, pandoc.Attr(el.attr.identifier, {}, figureAttr))
  
  -- remove identifier (it is now on the div)
  el.attr.identifier = ""
          
  -- apply standalone figure css
  figureDiv.attr.classes:insert("quarto-figure")
  figureDiv.attr.classes:insert("quarto-figure-" .. align)

  -- also forward any column or caption classes
  local currentClasses = el.attr.classes
  for _,k in pairs(currentClasses) do
    if isCaptionClass(k) or isColumnClass(k) then
      figureDiv.attr.classes:insert(k)
    end
  end

  -- begin figure
  figureDiv.content:insert(pandoc.RawBlock("html", "<figure>"))
  
  -- render (and collect caption)
  local figure, captionInlines = render(figureDiv)
  
  -- render caption
  if captionInlines and #captionInlines > 0 then
    local figureCaption = pandoc.Para({})
    figureCaption.content:insert(pandoc.RawInline(
      "html", "<figcaption>"
    ))
    tappend(figureCaption.content, captionInlines) 
    figureCaption.content:insert(pandoc.RawInline("html", "</figcaption>"))
    if capLocation('fig', 'bottom') == 'top' then
      figureDiv.content:insert(figureCaption)
      tappend(figureDiv.content, figure)
    else
      tappend(figureDiv.content, figure)
      figureDiv.content:insert(figureCaption)
    end
  else
    tappend(figureDiv.content, figure)
  end
  
  -- end figure and return
  figureDiv.content:insert(pandoc.RawBlock("html", "</figure>"))
  return figureDiv
  
end


function appendStyle(el, style)
  local baseStyle = attribute(el, "style", "")
  if baseStyle ~= "" and not string.find(baseStyle, ";$") then
    baseStyle = baseStyle .. ";"
  end
  el.attr.attributes["style"] = baseStyle .. style
end

function flexAlign(align)
  if align == "left" then
    return "flex-start"
  elseif align == "center" then
    return "center"
  elseif align == "right" then
    return "flex-end"
  end
end

function vAlignClass(vAlign) 
  if vAlign == "top" then 
    return "quarto-layout-valign-top"
  elseif vAlign == "bottom" then
    return "quarto-layout-valign-bottom"
  elseif vAlign == "center" then
    return "quarto-layout-valign-center"
  end
end


-- latex.lua
-- Copyright (C) 2020 by RStudio, PBC
kSideCaptionEnv = 'sidecaption'

function latexPanel(divEl, layout, caption)
  
   -- create container
  local panel = pandoc.Div({})
 
  -- begin container
  local env, pos = latexPanelEnv(divEl, layout)
  panel.content:insert(latexBeginEnv(env, pos));

  local capType = "fig"
  local locDefault = "bottom"
  if hasTableRef(divEl) then
    capType = "tbl"
    locDefault = "top"
  end
  local capLoc = capLocation(capType, locDefault)
  if (caption and capLoc == "top") then
    insertLatexCaption(divEl, panel.content, caption.content)
  end
  
   -- read vertical alignment and strip attribute
  local vAlign = validatedVAlign(divEl.attr.attributes[kLayoutVAlign])
  divEl.attr.attributes[kLayoutVAlign] = nil

  for i, row in ipairs(layout) do
    
    for j, cell in ipairs(row) do
      
      -- there should never be \begin{table} inside a panel (as that would 
      -- create a nested float). this can happen if knitr injected it as a 
      -- result of a captioned latex figure. in that case remove it
      cell = latexRemoveTableDelims(cell)
      
      -- process cell (enclose content w/ alignment)
      local endOfTable = i == #layout
      local endOfRow = j == #row
      local prefix, content, suffix = latexCell(cell, vAlign, endOfRow, endOfTable)
      panel.content:insert(prefix)
      local align = cell.attr.attributes[kLayoutAlign]
      if align == "center" then
        panel.content:insert(pandoc.RawBlock("latex", latexBeginAlign(align)))
      end
      tappend(panel.content, content)
      if align == "center" then
        panel.content:insert(pandoc.RawBlock("latex", latexEndAlign(align)))
      end
      panel.content:insert(suffix)
    end
    
  end
  
  -- surround caption w/ appropriate latex (and end the panel)
  if caption and capLoc == "bottom" then
    insertLatexCaption(divEl, panel.content, caption.content)
  end
  
  -- end latex env
  panel.content:insert(latexEndEnv(env));
  
  -- conjoin paragarphs 
  panel.content = latexJoinParas(panel.content)
 
  -- return panel
  return panel
  
end

-- determine the environment (and pos) to use for a latex panel
function latexPanelEnv(divEl, layout)
  
  -- defaults
  local env = latexFigureEnv(divEl)
  local pos = nil
  
  -- explicit figure panel
  if hasFigureRef(divEl) then
    pos = attribute(divEl, kFigPos, pos)
  -- explicit table panel
  elseif hasTableRef(divEl) then
    env = latexTableEnv(divEl)
  -- if there are embedded tables then we need to use table
  else 
    local haveTables = layout:find_if(function(row)
      return row:find_if(hasTableRef)
    end)
    if haveTables then
      env = latexTableEnv(divEl)
    end
  end

  return env, pos
  
end

-- conjoin paragraphs (allows % to work correctly between minipages or subfloats)
function latexJoinParas(content)
  local blocks = pandoc.List()
  for i,block in ipairs(content) do
    if block.t == "Para" and #blocks > 0 and blocks[#blocks].t == "Para" then
      tappend(blocks[#blocks].content, block.content)
    else
      blocks:insert(block)
    end
  end
  return blocks
end

function latexImageFigure(image)

  return renderLatexFigure(image, function(figure)
    
    -- make a copy of the caption and clear it
    local caption = image.caption:clone()
    tclear(image.caption)
    
    -- get align
    local align = figAlignAttribute(image)
   
    -- insert the figure without the caption
    local figureContent = { pandoc.Para({
      pandoc.RawInline("latex", latexBeginAlign(align)),
      image,
      pandoc.RawInline("latex", latexEndAlign(align)),
      pandoc.RawInline("latex", "\n")
    }) }
    
    -- return the figure and caption
    return figureContent, caption
    
  end)
end

function latexDivFigure(divEl)
  
  return renderLatexFigure(divEl, function(figure)
    
     -- get align
    local align = figAlignAttribute(divEl)

    -- append everything before the caption
    local blocks = tslice(divEl.content, 1, #divEl.content - 1)
    local figureContent = pandoc.List()
    if align == "center" then
      figureContent:insert(pandoc.RawBlock("latex", latexBeginAlign(align)))
    end
    tappend(figureContent, blocks)
    if align == "center" then
      figureContent:insert(pandoc.RawBlock("latex", latexEndAlign(align)))
    end
    
    -- return the figure and caption
    local caption = refCaptionFromDiv(divEl)
    if not caption then
      caption = pandoc.Inlines()
    end
    return figureContent, caption.content
   
  end)
  
end

function renderLatexFigure(el, render)
  
  -- create container
  local figure = pandoc.Div({})

  -- begin the figure
  local figEnv = latexFigureEnv(el)
  local figPos = latexFigurePosition(el, figEnv)

  figure.content:insert(latexBeginEnv(figEnv, figPos))
  
  -- get the figure content and caption inlines
  local figureContent, captionInlines = render(figure)  

  local capLoc = capLocation("fig", "bottom")  

  -- surround caption w/ appropriate latex (and end the figure)
  if captionInlines and inlinesToString(captionInlines) ~= "" then
    if capLoc == "top" then
      insertLatexCaption(el, figure.content, captionInlines)
      tappend(figure.content, figureContent)
    else
      tappend(figure.content, figureContent)
      insertLatexCaption(el, figure.content, captionInlines)
    end
  else
    tappend(figure.content, figureContent)
  end
  
  -- end figure
  figure.content:insert(latexEndEnv(figEnv))
  
  -- return the figure
  return figure
  
end

function latexCaptionEnv(el) 
  if el.attr.classes:includes(kSideCaptionClass) then
    return kSideCaptionEnv
  else
    return 'caption'
  end
end

function insertLatexCaption(divEl, content, captionInlines) 
  local captionEnv = latexCaptionEnv(divEl)
  markupLatexCaption(divEl, captionInlines, captionEnv)
  if captionEnv == kSideCaptionEnv then
    if #content > 1 then
      content:insert(2, pandoc.Para(captionInlines))
    else
      content:insert(#content, pandoc.Para(captionInlines))
    end
  else 
    content:insert(pandoc.Para(captionInlines))
  end
end

function latexWrapSignalPostProcessor(el, token) 
  -- this is a table div not in a panel note any caption environment
  tprepend(el.content, {pandoc.RawBlock('latex', '%quartopost-' .. token)});
  tappend(el.content, {pandoc.RawBlock('latex', '%/quartopost-' .. token)});
end

function latexMarkupCaptionEnv(el) 
  local captionEnv = latexCaptionEnv(el)
  if captionEnv == 'sidecaption' then
    latexWrapSignalPostProcessor(el, 'sidecaption-206BE349');
  end
end

        
function markupLatexCaption(el, caption, captionEnv)

  -- by default, just use the caption env
  if captionEnv == nil then
    captionEnv = 'caption'
  end

  local captionEnv = latexCaptionEnv(el)
  
  -- caption prefix (includes \\caption macro + optional [subcap] + {)
  local captionPrefix = pandoc.List({
    pandoc.RawInline("latex", "\\" .. captionEnv)
  })
  local figScap = attribute(el, kFigScap, nil)
  if figScap then
    captionPrefix:insert(pandoc.RawInline("latex", "["))
    tappend(captionPrefix, markdownToInlines(figScap))
    captionPrefix:insert(pandoc.RawInline("latex", "]"))
  end
  captionPrefix:insert(pandoc.RawInline("latex", "{"))
  tprepend(caption, captionPrefix)
  
  -- end the caption
  caption:insert(pandoc.RawInline("latex", "}"))
end

local kBeginSideNote = '\\marginnote{\\begin{footnotesize}'
function latexBeginSidenote(block) 
  if block == nil or block then
    return pandoc.RawBlock('latex', kBeginSideNote)
  else
    return pandoc.RawInline('latex', kBeginSideNote)
  end
end

local kEndSideNote = '\\end{footnotesize}}'
function latexEndSidenote(el, block)
  local offset = ''
  if el.attr ~= nil then
    local offsetValue = el.attr.attributes['offset']
    if offsetValue ~= nil then
      offset = '[' .. offsetValue .. ']'
    end  
  end
  if block == nil or block then
    return pandoc.RawBlock('latex', kEndSideNote .. offset)
  else
    return pandoc.RawInline('latex', kEndSideNote .. offset)
  end
end

function latexWrapEnvironment(el, env, inline) 
  tprepend(el.content, {latexBeginEnv(env, nil, inline)})
  tappend(el.content, {latexEndEnv(env, inline)})
end

function latexBeginAlign(align)
  if align == "center" then
    return "{\\centering "
  elseif align == "right" then
    return "\\hfill{} "      
  else
    return ""
  end
end

function latexEndAlign(align)
  if align == "center" then
    return "\n\n}"
  elseif align == "left" then
    return " \\hfill{}"
  else
    return ""
  end
end

function latexBeginEnv(env, pos, inline)
  local beginEnv = "\\begin{" .. env .. "}"
  if pos then
    if not string.find(pos, "^%[{") then
      pos = "[" .. pos .. "]"
    end
    beginEnv = beginEnv .. pos
  end
  if inline then
    return pandoc.RawInline("latex", beginEnv)
  else
    return pandoc.RawBlock("latex", beginEnv)
  end
end

function latexEndEnv(env, inline)
  if inline then
    return pandoc.RawInline("latex", "\\end{" .. env .. "}")
  else
    return pandoc.RawBlock("latex", "\\end{" .. env .. "}")
  end
end

function latexCell(cell, vAlign, endOfRow, endOfTable)

  -- figure out what we are dealing with
  local label = cell.attr.identifier
  local image = figureImageFromLayoutCell(cell)
  if (label == "") and image then
    label = image.attr.identifier
  end
  local isFigure = isFigureRef(label)
  local isTable = isTableRef(label)
  local isSubRef = hasRefParent(cell) or (image and hasRefParent(image))
  local tbl = tableFromLayoutCell(cell)
  
  -- determine width 
  local width = cell.attr.attributes["width"]
  
  -- derive prefix, content, and suffix
  local prefix = pandoc.List()
  local subcap = pandoc.List()
  local content = pandoc.List()
  local suffix = pandoc.List()

  -- sub-captioned always uses \subfloat
  if isSubRef then
    
    -- lift the caption out it it's current location and onto the \subfloat
    local caption = pandoc.List()
    
    -- see if it's a captioned figure
    if image and #image.caption > 0 then
      caption = image.caption:clone()
      tclear(image.caption)
    elseif tbl then
      caption = pandoc.utils.blocks_to_inlines(tbl.caption.long)
      tclear(tbl.caption.long)
      if tbl.caption.short then
        tclear(tbl.caption.short)
      end
      cell.content = { latexTabular(tbl, vAlign) }
    else
      local divCaption = refCaptionFromDiv(cell)
      if divCaption then
        caption = refCaptionFromDiv(cell).content
        cell.content = tslice(cell.content, 1, #cell.content-1)
      else
        caption = pandoc.List()
      end
    end
    
    -- subcap
    latexAppend(subcap, "\\subcaption{\\label{" .. label .. "}")
    tappend(subcap, caption)
    latexAppend(subcap, "}\n")
  end
  
  -- convert to latex percent as necessary
  width = asLatexSize(width)

  -- start the minipage
  local miniPageVAlign = latexMinipageValign(vAlign)
  latexAppend(prefix, "\\begin{minipage}" .. miniPageVAlign .. "{" .. width .. "}\n")

  local capType = "fig"
  local locDefault = "bottom"
  if isTable then
    capType = "tbl"
    locDefault = "top"
  end
  local capLoc = capLocation(capType, locDefault)

  if (capLoc == "top") then
    tappend(prefix, subcap)
  end

  -- if we aren't in a sub-ref we may need to do some special work to
  -- ensure that captions are correctly emitted
  local cellOutput = false;
  if not isSubRef then
    if image and #image.caption > 0 then
      local caption = image.caption:clone()
      markupLatexCaption(cell, caption)
      tclear(image.caption)
      content:insert(pandoc.RawBlock("latex", "\\raisebox{-\\height}{"))
      content:insert(pandoc.Para(image))
      content:insert(pandoc.RawBlock("latex", "}"))
      content:insert(pandoc.Para(caption))
      cellOutput = true
    elseif isFigure then
      local caption = refCaptionFromDiv(cell).content
      markupLatexCaption(cell, caption)
      content:insert(pandoc.RawBlock("latex", "\\raisebox{-\\height}{"))
      tappend(content, tslice(cell.content, 1, #cell.content-1))
      content:insert(pandoc.RawBlock("latex", "}"))
      content:insert(pandoc.Para(caption)) 
      cellOutput = true
    end
  end
  
  -- if we didn't find a special case then just emit everything
  if not cellOutput then
    tappend(content, cell.content)

    -- vertically align the minipage
    if miniPageVAlign == "[t]" and image ~= nil then
      tprepend(content, { pandoc.RawBlock("latex", "\\raisebox{-\\height}{")})
      tappend(content, { pandoc.RawBlock("latex", "}") })
    end  
  end

  if (capLoc == "bottom") then
    tappend(suffix, subcap)
  end

  -- close the minipage
  latexAppend(suffix, "\\end{minipage}%")
  
  latexAppend(suffix, "\n")
  if not endOfRow then
    latexAppend(suffix, "%")
  elseif not endOfTable then
    latexAppend(suffix, "\\newline")
  end
  latexAppend(suffix, "\n")
  
  -- ensure that pandoc doesn't write any nested figures
  for i,block in ipairs(content) do
    latexHandsoffFigure(block)
    content[i] = pandoc.walk_block(block, {
      Para = latexHandsoffFigure
    })
  end
  
  return pandoc.Para(prefix), content, pandoc.Para(suffix)
  
end

function latexTabular(tbl, vAlign)
  
  -- convert to simple table
  tbl = pandoc.utils.to_simple_table(tbl)
  
  -- list of inlines
  local tabular = pandoc.List()
  
  -- vertically align the minipage
  local tabularVAlign = latexMinipageValign(vAlign)
 
  -- caption
  if #tbl.caption > 0 then
    latexAppend(tabular, "\\caption{")
    tappend(tabular, tbl.caption)
    latexAppend(tabular, "}\n")
  end
  
  -- header
  local aligns = table.concat(tbl.aligns:map(latexTabularAlign), "")
  latexAppend(tabular, "\\begin{tabular}" .. tabularVAlign .. "{" .. aligns .. "}\n")
  latexAppend(tabular, "\\toprule\n")
  
  -- headers (optional)
  local headers = latexTabularRow(tbl.headers)
  if latexTabularRowHasContent(headers) then
    latexTabularRowAppend(tabular, headers)
    latexAppend(tabular, "\\midrule\n")
  end
  
  -- rows
  for _,row in ipairs(tbl.rows) do
    latexTabularRowAppend(tabular, latexTabularRow(row))
  end
  
  -- footer
  latexAppend(tabular, "\\bottomrule\n")
  latexAppend(tabular, "\\end{tabular}")
  
  -- return tabular
  return pandoc.Para(tabular)
  
end

function latexTabularRow(row)
  local cells = pandoc.List()
  for _,cell in ipairs(row) do
    cells:insert(pandoc.utils.blocks_to_inlines(cell))
  end
  return cells
end

function latexTabularRowHasContent(row)
  for _,cell in ipairs(row) do
    if #cell > 0 then
      return true
    end
  end
  return false
end

function latexTabularRowAppend(inlines, row)
  for i,cell in ipairs(row) do
    tappend(inlines, cell)
    if i < #row then
      latexAppend(inlines, " & ")
    end
  end
  latexAppend(inlines, "\\\\\n")
end

function latexTabularAlign(align)
  if align == pandoc.AlignLeft then
    return "l"
  elseif align == pandoc.AlignRight then
    return "r"
  elseif align == pandoc.AlignCenter then
    return "c"
  else
    return "l"
  end
end

function latexAppend(inlines, latex)
  inlines:insert(pandoc.RawInline("latex", latex))
end

function latexHandsoffFigure(el)
  if discoverFigure(el, false) ~= nil then
    el.content:insert(pandoc.RawInline("markdown", "<!-- -->"))
  end
end

function latexRemoveTableDelims(el)
  return pandoc.walk_block(el, {
    RawBlock = function(el)
      if _quarto.format.isRawLatex(el) then
        el.text = el.text:gsub("\\begin{table}[^\n]*\n", "")
        el.text = el.text:gsub("\\end{table}[^\n]*\n?", "")
        return el
      end
    end
  })
end

local kMarginFigureEnv = "marginfigure"

-- Computes the figure position for a figure environment
-- (margin figures, for example, don't support position since 
-- they're already in the margin)
function latexFigurePosition(el, env) 
  if env == kMarginFigureEnv then
    return nil
  else
    return attribute(el, kFigPos, nil)
  end
end

function latexFigureEnv(el) 
 -- Check whether the user has specified a figure environment
  local figEnv = attribute(el, kFigEnv, nil)
  if figEnv ~= nil then
    -- the user specified figure environment
    return figEnv
  else
    -- if not user specified, look for other classes which might determine environment
    local classes = el.classes
    for i,class in ipairs(classes) do

      -- a margin figure or aside
      if isMarginEnv(class) then 
        noteHasColumns()
        return kMarginFigureEnv
      end

      -- any column that resolves to full width
      if isStarEnv(class) then
        noteHasColumns()
        return "figure*"
      end
    end  

    -- the default figure environment
    return "figure"
  end
end

function latexOtherEnv(el)
    -- if not user specified, look for other classes which might determine environment
    local classes = el.classes
    if classes ~= nil then
      for i,class in ipairs(classes) do

        -- any column that resolves to full width
        if isStarEnv(class) then
          noteHasColumns()
          return "figure*"
        end
      end  
    end
    return nil
end

function latexTableEnv(el)
 
  local classes = el.classes
  for i,class in ipairs(classes) do

    -- a margin figure or aside
    if isMarginEnv(class) then 
      noteHasColumns()
      return "margintable"
    end

    -- any column that resolves to full width
    if isStarEnv(class) then
      noteHasColumns()
      return "table*"
    end
  end  

  -- the default figure environment
  return "table"
end


function isStarEnv(clz) 
  return (clz:match('^column%-screen') or clz:match('^column%-page')) and not clz:match('%-left$')
end

function isMarginEnv(clz) 
  return clz == 'column-margin' or clz == 'aside'
end

function latexMinipageValign(vAlign) 
  if vAlign == "top" then
   return "[t]"
  elseif vAlign == "bottom" then 
    return "[b]"
  elseif vAlign == "center" then 
    return "[c]"
  else
   return ""
  end
end


-- width.lua
-- Copyright (C) 2020 by RStudio, PBC

-- parse a layout specification
function parseLayoutWidths(figLayout, figureCount)
  
  -- parse json
  figLayout = pandoc.List(quarto.json.decode(figLayout))
  
  -- if there are no tables then make a table and stick the items in it
  if not figLayout:find_if(function(item) return type(item) == "table" end) then
     figLayout = pandoc.List({figLayout})
  end
      
  -- validate that layout is now all rows
  if figLayout:find_if(function(item) return type(item) ~= "table" end) then
    error("Invalid figure layout specification " .. 
          "(cannot mix rows and items at the top level")
  end
  
  -- convert numbers to strings as appropriate
  figureLayoutCount = 0
  figLayout = figLayout:map(function(row)
    --- get the cols
    local cols = pandoc.List(row)
    
    -- see if we have a total numeric value (no strings)
    local numericTotal = 0
    for i=1,#cols do 
      local width = cols[i]
      if type(width) == "number" then
        numericTotal = numericTotal + math.abs(width)
      else
        numericTotal = 0
        break
      end
    end
    
      
    return cols:map(function(width)
      figureLayoutCount = figureLayoutCount + 1
      if type(width) == "number" then
        if numericTotal ~= 0 then
          width = round((width / numericTotal) * 100, 2)
        elseif width <= 1 then
          width = round(width * 100, 2)
        end
        width = tostring(width) .. "%"
      end
      -- negative widths are "spacers" so we need to bump our total fig count
      if isSpacerWidth(width) then
        figureCount = figureCount + 1
      end
      -- return the width
      return width
    end)
  end)
  
  -- if there aren't enough rows then extend using the last row as a template
  local figureGap = figureCount - figureLayoutCount
  if figureGap > 0 then
    local lastRow = figLayout[#figLayout]
    local rowsToAdd = math.ceil(figureGap/#lastRow)
    for i=1,rowsToAdd do
      figLayout:insert(lastRow:clone())
    end
  end
   
  -- return the layout
  return figLayout
  
end

function isSpacerWidth(width)
  return pandoc.text.sub(width, 1, 1) == "-"
end


-- convert widths to percentages
function widthsToPercent(layout, cols)
  
  -- for each row
  for _,row in ipairs(layout) do
    
    -- determine numeric widths (and their total) for the row
    local widths = pandoc.List()
    for _,fig in ipairs(row) do
      widths[#widths+1] = 0
      local width = attribute(fig, "width", nil)
      if width then
        width = tonumber(string.match(width, "^(-?[%d%.]+)"))
        if width then
          widths[#widths] = width
        end
      end
    end
    
    -- create virtual fig widths as needed and note the total width
    local defaultWidth = widths:find_if(function(width) return width > 0 end)
    if defaultWidth == nil then
      defaultWidth = 42 -- this value is arbitrary
    end
    local totalWidth = 0
    for i=1,cols do
      if (i > #widths) or widths[i] == 0 then
        widths[i] = defaultWidth
      end
      totalWidth = totalWidth + widths[i]
    end
    -- allocate widths
    for i,fig in ipairs(row) do
      local width = round((widths[i]/totalWidth) * 100, 1)
      fig.attr.attributes["width"] = 
         tostring(width) .. "%"
      fig.attr.attributes["height"] = nil
    end
    
  end
end


-- elements with a percentage width and no height have a 'layout percent'
-- which means then should be laid out at a higher level in the tree than
-- the individual figure element
function horizontalLayoutPercent(el)
  return sizeToPercent(el.attr.attributes["width"])
end

function transferImageWidthToCell(img, divEl)
  divEl.attr.attributes["width"] = img.attributes["width"]
  if sizeToPercent(attribute(img, "width", nil)) then
    img.attributes["width"] = nil
  end
  img.attributes["height"] = nil
end



-- meta.lua
-- Copyright (C) 2020 by RStudio, PBC

-- inject metadata
function layoutMetaInject()
  return {
    Meta = function(meta)
      
      -- inject caption, subfig, tikz
      metaInjectLatex(meta, function(inject)
        inject(
          usePackage("caption") .. "\n" ..
          usePackage("subcaption")
        )
        if layoutState.usingTikz then
          inject(usePackage("tikz"))
        end
      end)

      -- This indicates whether the text highlighting theme has a 'light/dark' variant
      -- if it doesn't adapt, we actually will allow the text highlighting theme to control
      -- the appearance of the code block (e.g. so solarized will get a consistent yellow bg)
      local adaptiveTextHighlighting = param('adaptive-text-highlighting', false)

      -- If the user specifies 'code-block-border-left: false'
      -- then we should't give the code blocks this treatment
      local kCodeBlockBorderLeft = 'code-block-border-left'
      local kCodeBlockBackground = 'code-block-bg'

      -- Track whether to show a border or background
      -- Both options could be undefined, true / false or set to a color value
      local useCodeBlockBorder = (adaptiveTextHighlighting and meta[kCodeBlockBorderLeft] == nil and meta[kCodeBlockBackground] == nil) or (meta[kCodeBlockBorderLeft] ~= nil and meta[kCodeBlockBorderLeft] ~= false)
      local useCodeBlockBg = meta[kCodeBlockBackground] ~= nil and meta[kCodeBlockBackground] ~= false

      -- if we're going to display a border or background
      -- we need to inject color handling as well as the 
      -- box definition for code blocks
      if (useCodeBlockBorder or useCodeBlockBg) then
        metaInjectLatex(meta, function(inject)
          inject(
            usePackageWithOption("tcolorbox", "many")
          )
        end)

        -- figure out the shadecolor
        local shadeColor = nil
        if useCodeBlockBorder and meta[kCodeBlockBorderLeft] and type(meta[kCodeBlockBorderLeft]) ~= "boolean" then
          shadeColor = latexXColor(meta[kCodeBlockBorderLeft])
        elseif useCodeBlockBg and meta[kCodeBlockBackground] and type(meta[kCodeBlockBackground]) ~= "boolean"  then
          shadeColor = latexXColor(meta[kCodeBlockBackground])
        end

        -- ensure shadecolor is defined
        metaInjectLatex(meta, function(inject)
          if (shadeColor ~= nil) then
            inject(
              "\\@ifundefined{shadecolor}{\\definecolor{shadecolor}" .. shadeColor .. "}"
            )  
          else
            inject(
              "\\@ifundefined{shadecolor}{\\definecolor{shadecolor}{rgb}{.97, .97, .97}}"
            )  
          end
        end)

        -- set color options for code blocks ('Shaded')
        local options = {
          ['interior hidden'] = "",
          boxrule = '0pt',
          ['frame hidden'] = "",
          ['sharp corners'] = "",
          ['breakable'] = "",
          enhanced = "",
          ['borderline west'] = '{3pt}{0pt}{shadecolor}'
        }
        if useCodeBlockBg then 
          options = {
            colback = "{shadecolor}",
            boxrule = '0pt',
            ['frame hidden'] = "",
            ['breakable'] = "",
            enhanced = "",
          }
        end
        
        -- redefined the 'Shaded' environment that pandoc uses for fenced 
        -- code blocks
        metaInjectLatexBefore(meta, function(inject)
          inject("\\ifdefined\\Shaded\\renewenvironment{Shaded}{\\begin{tcolorbox}[" .. tColorOptions(options) .. "]}{\\end{tcolorbox}}\\fi")
        end)
      end



      -- enable column layout (packages and adjust geometry)
      if (layoutState.hasColumns or marginReferences() or marginCitations()) and _quarto.format.isLatexOutput() then
        -- inject sidenotes package
        metaInjectLatex(meta, function(inject)
          inject(
            usePackage("sidenotes")
          )
          inject(
            usePackage("marginnote")
          )
        end)
        
        if marginCitations() and meta.bibliography ~= nil then 
          local citeMethod = param('cite-method', 'citeproc')
          if citeMethod == 'natbib' then
            metaInjectLatex(meta, function(inject)
              inject(
                usePackage("bibentry")
              )  
              inject(
                usePackage("marginfix")
              )  

            end)
            metaInjectLatex(meta, function(inject)
              inject(
                '\\nobibliography*'
              )
            end)
  
          elseif citeMethod == 'biblatex' then
            metaInjectLatex(meta, function(inject)
              inject(
                usePackage("biblatex")
              )  
            end)
          end
        end

        -- add layout configuration based upon the document class
        -- we will customize any koma templates that have no custom geometries 
        -- specified. If a custom geometry is specified, we're expecting the
        -- user to address the geometry and layout
        local documentclassRaw = readOption(meta, 'documentclass');
        if documentclassRaw ~= nil then 
          local documentclass = pandoc.utils.stringify(documentclassRaw)
          if documentclass == 'scrartcl' or documentclass == 'scrarticle' or 
             documentclass == 'scrlttr2' or documentclass == 'scrletter' or
             documentclass == 'scrreprt' or documentclass == 'scrreport' then
            oneSidedColumnLayout(meta)
          elseif documentclass == 'scrbook' then
            -- better compute sidedness and deal with it
            -- choices are one, two, or semi
            local side = booksidedness(meta)
            if side == 'one' then
              oneSidedColumnLayout(meta)
            else
              twoSidedColumnLayout(meta, side == 'semi')
            end
          end  
        end
      end
      return meta
    end
  }
end

function booksidedness(meta)
  local side = 'two'
  local classoption = readOption(meta, 'classoption')
  if classoption then
    for i, v in ipairs(classoption) do
      local option = pandoc.utils.stringify(v)
      if option == 'twoside=semi' then
        side = 'semi'
      elseif option == 'twoside' or option == 'twoside=on' or option == 'twoside=true' or option == 'twoside=yes' then
        side = 'two'
      elseif option == 'twoside=false' or option == 'twoside=no' or option == 'twoside=off' then
        side = 'one'
      end
    end
  end
  return side
end

function marginReferences() 
  return param('reference-location', 'document') == 'margin'
end 

function marginCitations()
  return param('citation-location', 'document') == 'margin'
end

function twoSidedColumnLayout(meta, oneside)
  baseGeometry(meta, oneside)
end

function oneSidedColumnLayout(meta)
  local classoption = readOption(meta, 'classoption')
  if classoption == nil then
    classoption = pandoc.List({})
  end

  -- set one sided if not sidedness not already set
  local sideoptions = classoption:filter(function(opt) 
    local text = pandoc.utils.stringify(opt)
    return text:find('oneside') == 1 or text:find('twoside') == 1
  end)
  
  if #sideoptions == 0 then
    classoption:insert('oneside')
    meta.classoption = classoption
  end
  
  baseGeometry(meta)
end

function baseGeometry(meta, oneside)

  -- customize the geometry
  if not meta.geometry then
    meta.geometry = pandoc.List({})
  end  
  local userDefinedGeometry = #meta.geometry ~= 0

  -- if only 'showframe' is passed, we can still modify the geometry
  if #meta.geometry == 1 then
    if #meta.geometry[1] == 1 then
      local val = meta.geometry[1][1]
      if val.t == 'Str' and val.text == 'showframe' then
        userDefinedGeometry = false
      end
    end
  end 

  if not userDefinedGeometry then
    -- if one side geometry is explicitly requested, the
    -- set that (used for twoside=semi)
    if oneside then
      quarto.log.output("ONESIDE")
      tappend(meta.geometry, {"twoside=false"})
    end
      
    tappend(meta.geometry, geometryForPaper(meta.papersize))
  end
end

-- We will automatically compute a geometry for a papersize that we know about
function geometryForPaper(paperSize)
  if paperSize ~= nil then
    local paperSizeStr = paperSize[1].text
    local width = kPaperWidthsIn[paperSizeStr]
    if width ~= nil then
      return geometryFromPaperWidth(width)
    else
      return pandoc.List({})
    end
  else 
    return pandoc.List({})
  end
end

function geometryFromPaperWidth(paperWidth) 
  local geometry = pandoc.List({})
  geometry:insert(metaInlineStr('left=' .. left(paperWidth) .. 'in'))
  geometry:insert(metaInlineStr('marginparwidth=' .. marginParWidth(paperWidth) .. 'in'))
  geometry:insert(metaInlineStr('textwidth=' .. textWidth(paperWidth) .. 'in'))
  geometry:insert(metaInlineStr('marginparsep=' .. marginParSep(paperWidth) .. 'in'))
  return geometry
end

function metaInlineStr(str) 
  return pandoc.Inlines({pandoc.Str(str)})
end


-- We will only provide custom geometries for paper widths that we are 
-- aware of and that would work well for wide margins. Some sizes get
-- so small that there just isn't a good way to represent the margin layout
-- so we just throw up our hands and take the default geometry
kPaperWidthsIn = {
  a0 = 33.11,
  a1 = 23.39,
  a2 = 16.54,
  a3 = 11.69,
  a4 = 8.3,
  a5 = 5.83,
  a6 = 4.13,
  a7 = 2.91,
  a8 = 2.05,
  b0 = 39.37,
  b1 = 27.83,
  b2 = 19.69,
  b3 = 13.90,
  b4 = 9.84,
  b5 = 6.93,
  b6 = 4.92,
  b7 = 3.46,
  b8 = 2.44,
  b9 = 1.73,
  b10 = 1.22,
  letter = 8.5,
  legal = 8.5,
  ledger =  11,
  tabloid = 17,
  executive = 7.25
}

local kLeft = 1
local kMarginParSep = .3

function left(width)
  if width >= kPaperWidthsIn.a4 then
    return kLeft
  else
    return kLeft * width / kPaperWidthsIn.a4
  end
end

function marginParSep(width)
  if width >= kPaperWidthsIn.a6 then
    return kMarginParSep
  else
    return kMarginParSep * width / kPaperWidthsIn.a4
  end
end

function marginParWidth(width) 
  return (width - 2*left(width) - marginParSep(width)) / 3
end

function textWidth(width)
  return ((width - 2*left(width) - marginParSep(width)) * 2) / 3
end



-- layout.lua
-- Copyright (C) 2020 by RStudio, PBC

-- required version
PANDOC_VERSION:must_be_at_least '2.13'

-- global layout state
layoutState = {
  hasColumns = false,
}




function layoutPanels()

  return {
    Div = function(el)
      if requiresPanelLayout(el) then
        
        -- partition
        local preamble, cells, caption = partitionCells(el)
        
        -- derive layout
        local layout = layoutCells(el, cells)
        
        -- call the panel layout functions
        local panel
        if _quarto.format.isLatexOutput() then
          panel = latexPanel(el, layout, caption)
        elseif _quarto.format.isHtmlOutput() then
          panel = htmlPanel(el, layout, caption)
        elseif _quarto.format.isDocxOutput() then
          panel = tableDocxPanel(el, layout, caption)
        elseif _quarto.format.isOdtOutput() then
          panel = tableOdtPanel(el, layout, caption)
        elseif _quarto.format.isWordProcessorOutput() then
          panel = tableWpPanel(el, layout, caption)
        elseif _quarto.format.isPowerPointOutput() then
          panel = pptxPanel(el, layout)
        else
          panel = tablePanel(el, layout, caption)
        end

        -- transfer attributes from el to panel
        local keys = tkeys(el.attr.attributes)
        for _,k in pairs(keys) do
          if not isLayoutAttribute(k) then
            panel.attr.attributes[k] = el.attr.attributes[k]
          end
        end
        
        if #preamble > 0 then
          local div = pandoc.Div({})
          if #preamble > 0 then
            tappend(div.content, preamble)
          end
          div.content:insert(panel)
          return div
          
        -- otherwise just return the panel
        else
          return panel
        end
        
      end
    end
  }  
end


function requiresPanelLayout(divEl)
  
  if hasLayoutAttributes(divEl) then
    return true
  -- latex and html require special layout markup for subcaptions
  elseif (_quarto.format.isLatexOutput() or _quarto.format.isHtmlOutput()) and 
          divEl.attr.classes:includes("tbl-parent") then
    return true
  else 
    return false
  end
  
end


function partitionCells(divEl)
  
  local preamble = pandoc.List()
  local cells = pandoc.List()
  local caption = nil
  
  -- extract caption if it's a table or figure div
  if hasFigureOrTableRef(divEl) then
    caption = refCaptionFromDiv(divEl)
    divEl.content = tslice(divEl.content, 1, #divEl.content-1)
  end
  
  local heading = nil
  for _,block in ipairs(divEl.content) do
    
    if isPreambleBlock(block) then
      if block.t == "CodeBlock" and #preamble > 0 and preamble[#preamble].t == "CodeBlock" then
        preamble[#preamble].text = preamble[#preamble].text .. "\n" .. block.text
      else
        preamble:insert(block)
      end
    elseif block.t == "Header" then
      if _quarto.format.isRevealJsOutput() then
        heading = pandoc.Para({ pandoc.Strong(block.content)})
      else
        heading = block
      end
    else 
      -- ensure we are dealing with a div
      local cellDiv = nil
      if block.t == "Div" then
        -- if this has a single figure div then unwrap it
        if #block.content == 1 and 
           block.content[#block.content].t == "Div" and
           hasFigureOrTableRef(block.content[#block.content]) then
          cellDiv = block.content[#block.content]
        else
          cellDiv = block
        end
      
      else
        cellDiv = pandoc.Div(block)
      end
      
      -- special behavior for cells with figures (including ones w/o captions)
      local fig = figureImageFromLayoutCell(cellDiv)
      if fig then
        -- transfer width to cell
        transferImageWidthToCell(fig, cellDiv)
      end
      
      -- if we have a heading then insert it
      if heading then 
        cellDiv.content:insert(1, heading)
        heading = nil
      end

      -- if this is .cell-output-display that isn't a figure or table 
      -- then unroll multiple blocks
      if cellDiv.attr.classes:find("cell-output-display") and 
         #cellDiv.content > 1 and 
         not hasFigureOrTableRef(cellDiv) then
        for _,outputBlock in ipairs(cellDiv.content) do
          if outputBlock.t == "Div" then
            cells:insert(outputBlock)
          else
            cells:insert(pandoc.Div(outputBlock))
          end
        end
      else
        -- add the div
        cells:insert(cellDiv)
      end
      
    end
    
  end

  return preamble, cells, caption
  
end


function layoutCells(divEl, cells)
  
  -- layout to return (list of rows)
  local rows = pandoc.List()
  
  -- note any figure layout attributes
  local layoutRows = tonumber(attribute(divEl, kLayoutNrow, nil))
  local layoutCols = tonumber(attribute(divEl, kLayoutNcol, nil))
  local layout = attribute(divEl, kLayout, nil)
  
  -- default to 1 column if nothing is specified
  if not layoutCols and not layoutRows and not layout then
    layoutCols = 1
  end
  
  -- if there is layoutRows but no layoutCols then compute layoutCols
  if not layoutCols and layoutRows ~= nil then
    layoutCols = math.ceil(#cells / layoutRows)
  end
  
  -- check for cols
  if layoutCols ~= nil then
    for i,cell in ipairs(cells) do
      if math.fmod(i-1, layoutCols) == 0 then
        rows:insert(pandoc.List())
      end
      rows[#rows]:insert(cell)
    end
    -- convert width units to percentages
    widthsToPercent(rows, layoutCols)
    
  -- check for layout
  elseif layout ~= nil then
    -- parse the layout
    layout = parseLayoutWidths(layout, #cells)
    
    -- manage/perform next insertion into the layout
    local cellIndex = 1
    function layoutNextCell(width)
      -- check for a spacer width (negative percent)
      if isSpacerWidth(width) then
        local cell = pandoc.Div({
          pandoc.Para({pandoc.Str(" ")}),
          pandoc.Para({})
        }, pandoc.Attr(
          "", 
          { "quarto-figure-spacer" }, 
          { width = pandoc.text.sub(width, 2, #width) }
        ))
        rows[#rows]:insert(cell)
      -- normal figure layout
      else
        local cell = cells[cellIndex]
        if cell then
          cellIndex = cellIndex + 1
          cell.attr.attributes["width"] = width
          cell.attr.attributes["height"] = nil
          rows[#rows]:insert(cell)
        end
      end
    end
  
    -- process the layout
    for _,item in ipairs(layout) do
      if cellIndex > #cells then
        break
      end
      rows:insert(pandoc.List())
      for _,width in ipairs(item) do
        layoutNextCell(width)
      end
    end
    
  end
  
  -- determine alignment
  local align = layoutAlignAttribute(divEl)
  
  -- some width and alignment handling
  rows = rows:map(function(row)
    return row:map(function(cell)
      
      -- percentage based layouts need to be scaled down so they don't overflow the page 
      local percentWidth = sizeToPercent(attribute(cell, "width", nil))
      if percentWidth then
        percentWidth = round(percentWidth,1)
        cell.attr.attributes["width"] = tostring(percentWidth) .. "%"
      end
      
      -- provide default alignment if necessary
      cell.attr.attributes[kLayoutAlign] = layoutCellAlignment(cell, align)
     
      -- return cell
      return cell
    end)
   
  end)  

  -- return layout
  return rows
  
end

function isPreambleBlock(el)
  return (el.t == "CodeBlock" and el.attr.classes:includes("cell-code")) or
         (el.t == "Div" and el.attr.classes:includes("cell-output-stderr"))
end

-- chain of filters
return {
  initOptions(),
  columnsPreprocess(),
  columns(),
  citesPreprocess(),
  cites(),
  layoutPanels(),
  extendedFigures(),
  layoutMetaInject()
}


