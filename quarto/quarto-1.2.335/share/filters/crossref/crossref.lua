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

-- string.lua
-- Copyright (C) 2020 by RStudio, PBC


-- tests whether a string ends with another string
function endsWith(str, ending) 
  return ending == "" or str:sub(-#ending) == ending
end

function startsWith(str, starting) 
  return starting == "" or str:sub(1, #starting) == starting
end

-- trim a string
function trim(s)
  return (string.gsub(s, "^%s*(.-)%s*$", "%1"))
end

-- splits a string on a separator
function split(str, sep)
  local fields = {}
  
  local sep = sep or " "
  local pattern = string.format("([^%s]+)", sep)
  local _ignored = string.gsub(str, pattern, function(c) fields[#fields + 1] = c end)
  
  return fields
end

-- escape string by converting using Pandoc
function stringEscape(str, format)
  local doc = pandoc.Pandoc({pandoc.Para(str)})
  return pandoc.write(doc, format)
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

-- theorems.lua
-- Copyright (C) 2020 by RStudio, PBC

-- available theorem types
theoremTypes = {
  thm = {
    env = "theorem",
    style = "plain",
    title = "Theorem"
  },
  lem = {
    env = "lemma",
    style = "plain",
    title = "Lemma"
  },
  cor = {
    env = "corollary",
    style = "plain",
    title = "Corollary",
  },
  prp = {
    env = "proposition",
    style = "plain",
    title = "Proposition",
  },
  cnj = {
    env = "conjecture",
    style = "plain",
    title = "Conjecture"
  },
  def = {
    env = "definition",
    style = "definition",
    title = "Definition",
  },
  exm = {
    env = "example",
    style = "definition",
    title = "Example",
  },
  exr  = {
    env = "exercise",
    style = "definition",
    title = "Exercise"
  }
}

function hasTheoremRef(el)
  local type = refType(el.attr.identifier)
  return theoremTypes[type] ~= nil
end

proofTypes = {
  proof =  {
    env = 'proof',
    title = 'Proof'
  },
  remark =  {
    env = 'remark',
    title = 'Remark'
  },
  solution = {
    env = 'solution',
    title = 'Solution'
  }
}

function proofType(el)
  local type = el.attr.classes:find_if(function(clz) return proofTypes[clz] ~= nil end)
  if type ~= nil then
    return proofTypes[type]
  else
    return nil
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




-- file-metadata.lua
-- Copyright (C) 2020 by RStudio, PBC


fileMetadataState = {
  file = nil,
  appendix = false,
  include_directory = nil,
}


function fileMetadata() 
  return {
    RawInline = parseFileMetadata,
    RawBlock = parseFileMetadata
  }
end

function parseFileMetadata(el)
  if _quarto.format.isRawHtml(el) then
    local rawMetadata = string.match(el.text, "^<!%-%- quarto%-file%-metadata: ([^ ]+) %-%->$")
    if rawMetadata then
      local decoded = base64_decode(rawMetadata)
      local file = quarto.json.decode(decoded)
      fileMetadataState.file = file
      -- flip into appendix mode as appropriate
      if file.bookItemType == "appendix" then
        fileMetadataState.appendix = true
      end

      -- set and unset file directory for includes
      if file.include_directory ~= nil then
        fileMetadataState.include_directory = file.include_directory
      end
      if file.clear_include_directory ~= nil then
        fileMetadataState.include_directory = nil
      end
    end
  end
  return el
end

function currentFileMetadataState()
  return fileMetadataState
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

-- format.lua
-- Copyright (C) 2020 by RStudio, PBC

function round(num, numDecimalPlaces)
  local mult = 10^(numDecimalPlaces or 0)
  return math.floor(num * mult + 0.5) / mult
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

-- options.lua
-- Copyright (C) 2020 by RStudio, PBC

-- initialize options from 'crossref' metadata value
function initCrossrefOptions()
  return {
    Meta = function(meta)
      crossref.options = readFilterOptions(meta, "crossref")

      -- automatically set maxHeading to 1 if we are in chapters mode, otherwise set to max (7)
      if crossrefOption("chapters", false) then
        crossref.maxHeading = 1
      else
        crossref.maxHeading = 7
      end

    end
  }
end

-- get option value
function crossrefOption(name, default)
  return readOption(crossref.options, name, default)
end




-- format.lua
-- Copyright (C) 2020 by RStudio, PBC

function title(type, default)
  default = param("crossref-" .. type .. "-title", default)
  return crossrefOption(type .. "-title", stringToInlines(default))
end

function envTitle(type, default)
  return param("environment-" .. type .. "-title", default)
end

function titleString(type, default)
  return pandoc.utils.stringify(title(type, default))
end

function titlePrefix(type, default, order)
  local prefix = title(type, default)
  table.insert(prefix, nbspString())
  tappend(prefix, numberOption(type, order))
  tappend(prefix, titleDelim())
  table.insert(prefix, pandoc.Space())
  return prefix
end

function titleDelim()
  return crossrefOption("title-delim", stringToInlines(":"))
end

function captionSubfig()
  return crossrefOption("caption-subfig", true)
end

function captionCollectedDelim()
  return crossrefOption("caption-collected-delim", stringToInlines(",\u{a0}"))
end

function captionCollectedLabelSep()
  return crossrefOption("caption-collected-label-sep", stringToInlines("\u{a0}—\u{a0}"))
end

function subrefNumber(order)
  return numberOption("subref", order,  {pandoc.Str("alpha"),pandoc.Space(),pandoc.Str("a")})
end

function prependSubrefNumber(captionContent, order)
  if not _quarto.format.isLatexOutput() then
    if #inlinesToString(captionContent) > 0 then
      tprepend(captionContent, { pandoc.Space() })
    end
    tprepend(captionContent, { pandoc.Str(")") })
    tprepend(captionContent, subrefNumber(order))
    captionContent:insert(1, pandoc.Str("("))
  end
end

function refPrefix(type, upper)
  local opt = type .. "-prefix"
  local default = stringToInlines(param("crossref-" .. type .. "-prefix", type .. "."))
  local prefix = crossrefOption(opt, default)
  if upper then
    local el = pandoc.Plain(prefix)
    local firstStr = true
    el = pandoc.walk_block(el, {
      Str = function(str)
        if firstStr then
          local strText = pandoc.text.upper(pandoc.text.sub(str.text, 1, 1)) .. pandoc.text.sub(str.text, 2, -1)
          str = pandoc.Str(strText)
          firstStr = false
        end
        return str
      end
    })
    prefix = el.content
  end
  return prefix
end

function refDelim()
  return crossrefOption("ref-delim", stringToInlines(","))
end

function refHyperlink()
  return crossrefOption("ref-hyperlink", true)
end

function refNumberOption(type, entry)

  -- for sections just return the section levels
  if type == "sec" then
    local num = nil
    if entry.appendix then
      num = string.char(64 + entry.order.section[1] - crossref.startAppendix + 1)
    elseif crossrefOption("chapters", false) then
      num = tostring(entry.order.section[1])
    end
    return stringToInlines(sectionNumber(entry.order.section, nil, num))
  end

  -- handle other ref types
  return formatNumberOption(type, entry.order)
end


function numberOption(type, order, default)
  
  -- for sections, just return the section levels (we don't currently
  -- support custom numbering for sections since pandoc is often the
  -- one doing the numbering)
  if type == "sec" then
    return stringToInlines(sectionNumber(order.section))
  end

  -- format
  return formatNumberOption(type, order, default)
end

function formatNumberOption(type, order, default)

  -- alias num and section (set section to nil if we aren't using chapters)
  local num = order.order
  local section = order.section
  if not crossrefOption("chapters", false) then
    section = nil
  elseif section ~= nil and section[1] == 0 then
    section = nil
  elseif crossref.maxHeading ~= 1 then
    section = nil
  end
  
  -- return a pandoc.Str w/ chapter prefix (if any)
  function resolve(num)
    if section then
      local sectionIndex = section[1]
      if crossrefOption("chapters-alpha", false) then
        sectionIndex = string.char(64 + sectionIndex)
      elseif crossref.startAppendix ~= nil and sectionIndex >= crossref.startAppendix then
        sectionIndex = string.char(64 + sectionIndex - crossref.startAppendix + 1)
      else
        sectionIndex = tostring(sectionIndex)
      end
      num = sectionIndex .. "." .. num
    end
    return { pandoc.Str(num) }
  end
  
  -- Compute option name and default value
  local opt = type .. "-labels"
  if default == nil then
    default = stringToInlines("arabic")
  end

  -- See if there a global label option, if so, use that
  -- if the type specific label isn't specified
  local labelOpt = crossrefOption("labels", default);
  
  -- determine the style
  local styleRaw = crossrefOption(opt, labelOpt)


  local numberStyle = pandoc.utils.stringify(styleRaw)

  -- process the style
  if (numberStyle == "arabic") then
    return resolve(tostring(num))
  elseif (string.match(numberStyle, "^alpha ")) then
    -- permits the user to include the character that they'd like
    -- to start the numbering with (e.g. alpha a vs. alpha A)
    local startIndexChar = string.sub(numberStyle, -1)
    if (startIndexChar == " ") then
      startIndexChar = "a"
    end
    local startIndex = utf8.codepoint(startIndexChar)
    return resolve(string.char(startIndex + num - 1))
  elseif (string.match(numberStyle, "^roman")) then
    -- permits the user to express `roman` or `roman i` or `roman I` to
    -- use lower / uppper case roman numerals
    local lower = false
    if (string.sub(numberStyle, -#"i") == "i") then
      lower = true
    end
    return resolve(toRoman(num, lower))
  else
    -- otherwise treat the value as a list of values to use
    -- to display the numbers
    local entryCount = #styleRaw

    -- select an index based upon the num, wrapping it around
    local entryIndex = (num - 1) % entryCount + 1
    local option = styleRaw[entryIndex]:clone()
    if section then
      tprepend(option, { pandoc.Str(tostring(section[1]) .. ".") })
    end
    return option
  end

end


function sectionNumber(section, maxLevel, num)

  if num == nil then
    num = ""
    if crossref.maxHeading == 1 then
      num = formatChapterIndex(section[1])
    end
  end

  local endIndex = #section
  if maxLevel then
    endIndex = maxLevel
  end
  local lastIndex = 1
  for i=endIndex,2,-1 do
    if section[i] > 0 then
      lastIndex = i
      break
    end
  end

  for i=2,lastIndex do
    if num ~= '' then
      num = num .. "."
    end
    num = num .. tostring(section[i])
  end

  return num
end

function isChapterRef(section)
  for i=2,#section do
    if section[i] > 0 then
      return false
    end
  end
  return true
end

function formatChapterIndex(index)
  local fileMetadata = currentFileMetadataState()
  if fileMetadata.appendix then
    return string.char(64 + fileMetadata.file.bookItemNumber)
  elseif crossrefOption("chapters-alpha", false) then
    return string.char(64 + index)
  else
    return tostring(index)
  end
end

function toRoman(num, lower)
  local roman = pandoc.utils.to_roman_numeral(num)
  if lower then
    lower = ''
    for i = 1, #roman do
      lower = lower .. string.char(utf8.codepoint(string.sub(roman,i,i)) + 32)
    end
    return lower
  else
    return roman
  end
end

-- meta.lua
-- Copyright (C) 2020 by RStudio, PBC

-- inject metadata
function crossrefMetaInject()
  return {
    Meta = function(meta)
      metaInjectLatex(meta, function(inject)
        
        inject(usePackage("caption"))

        inject(
          "\\AtBeginDocument{%\n" ..
          maybeRenewCommand("contentsname", param("toc-title-document", "Table of contents")) ..
          maybeRenewCommand("listfigurename", listOfTitle("lof", "List of Figures")) ..
          maybeRenewCommand("listtablename", listOfTitle("lot", "List of Tables")) ..
          maybeRenewCommand("figurename", titleString("fig", "Figure")) ..
          maybeRenewCommand("tablename", titleString("tbl", "Table")) ..
          "}\n"
        )
      
        if latexListings() then
          inject(
            "\\newcommand*\\listoflistings\\lstlistoflistings\n" ..
            "\\AtBeginDocument{%\n" ..
            "\\renewcommand*\\lstlistlistingname{" .. listOfTitle("lol", "List of Listigs") .. "}\n" ..
            "}\n"
          )
        else
          inject(
            usePackage("float") .. "\n" ..
            "\\floatstyle{ruled}\n" ..
            "\\@ifundefined{c@chapter}{\\newfloat{codelisting}{h}{lop}}{\\newfloat{codelisting}{h}{lop}[chapter]}\n" ..
            "\\floatname{codelisting}{" .. titleString("lst", "Listing") .. "}\n"
          )

          inject(
            "\\newcommand*\\listoflistings{\\listof{codelisting}{" .. listOfTitle("lol", "List of Listings") .. "}}\n"
          )
        end
        
        local theoremIncludes = theoremLatexIncludes()
        if theoremIncludes then
          inject(theoremIncludes)
        end
      end)
      
      return meta
    end
  }
end

function maybeRenewCommand(command, arg) 
  local commandWithArg = command .. "{" .. arg .. "}"
  return "\\ifdefined\\" .. command .. "\n  " .. "\\renewcommand*\\" .. commandWithArg .. "\n\\else\n  " .. "\\newcommand\\" .. commandWithArg .. "\n\\fi\n"
end


-- latex 'listof' title for type
function listOfTitle(type, default)
  local title = crossrefOption(type .. "-title")
  if title then
    return pandoc.utils.stringify(title)
  else
    return param("crossref-" .. type .. "-title", default)
  end
end

-- refs.lua
-- Copyright (C) 2020 by RStudio, PBC


-- resolve references
function resolveRefs()
  
  return {
    Cite = function(citeEl)
    
      -- all valid ref types (so we can provide feedback when one doesn't match)
      local refTypes = validRefTypes()
      
      -- scan citations for refs
      local refs = pandoc.List()
      for i, cite in ipairs (citeEl.citations) do
        -- get the label and type, and note if the label is uppercase
        local label = cite.id
        local type = refType(label)
        if type ~= nil and isValidRefType(type) then
          local upper = not not string.match(cite.id, "^[A-Z]")

          -- convert the first character of the label to lowercase for lookups
          label = pandoc.text.lower(label:sub(1, 1)) .. label:sub(2)
        
          -- lookup the label
          local resolve = param("crossref-resolve-refs", true)
          local entry = crossref.index.entries[label]
          if entry ~= nil or not resolve then
        
            -- preface with delimiter unless this is citation 1
            if (i > 1) then
              refs:extend(refDelim())
              refs:extend(stringToInlines(" "))
            end
  
            -- create ref text
            local ref = pandoc.List()
            if #cite.prefix > 0 then
              ref:extend(cite.prefix)
              ref:extend({nbspString()})
            elseif cite.mode ~= pandoc.SuppressAuthor then
              
              -- some special handling to detect chapters and use
              -- an alternate prefix lookup
              local prefixType = type
              local chapters = crossrefOption("chapters", false)
              if chapters and entry then
                if resolve and type == "sec" and isChapterRef(entry.order.section) then
                  if entry.appendix then
                    prefixType = "apx"
                  else
                    prefixType = "ch"
                  end
                end
              end
              if resolve or type ~= "sec" then
                local prefix = refPrefix(prefixType, upper)
                if #prefix > 0 then
                  ref:extend(prefix)
                  ref:extend({nbspString()})
                end
              end
              
            end
  
            -- for latex inject a \ref, otherwise format manually
            if _quarto.format.isLatexOutput() then
              ref:extend({pandoc.RawInline('latex', '\\ref{' .. label .. '}')})
            else
              if not resolve then
                local refClasses = pandoc.List({"quarto-unresolved-ref"})
                if #cite.prefix > 0 or cite.mode == pandoc.SuppressAuthor then
                  refClasses:insert("ref-noprefix")
                end
                local refSpan = pandoc.Span(
                  stringToInlines(label), 
                  pandoc.Attr("", refClasses)
                )
                ref:insert(refSpan)
              elseif entry ~= nil then
                if entry.parent ~= nil then
                  local parentType = refType(entry.parent)
                  local parent = crossref.index.entries[entry.parent]
                  ref:extend(refNumberOption(parentType,parent))
                  ref:extend({pandoc.Space(), pandoc.Str("(")})
                  ref:extend(subrefNumber(entry.order))
                  ref:extend({pandoc.Str(")")})
                else
                  ref:extend(refNumberOption(type, entry))
                end
              end
  
                -- link if requested
              if (refHyperlink()) then
                ref = {pandoc.Link(ref, "#" .. label)}
              end
            end
  
            -- add the ref
            refs:extend(ref)
  
          -- no entry for this reference, if it has a valid ref prefix
          -- then yield error text
          elseif tcontains(refTypes, type) then
            warn("Unable to resolve crossref @" .. label)
            local err = pandoc.Strong({ pandoc.Str("?@" .. label) })
            refs:extend({err})
          end
        end
      end

      -- swap citeEl for refs if we found any
      if #refs > 0 then
        return refs
      else
        return citeEl
      end


    end
  }
end

function autoRefLabel(parentId)
  local index = 1
  while true do
    local label = parentId .. "-" .. tostring(index)
    if not crossref.autolabels:includes(label) then
      crossref.autolabels:insert(label)
      return label
    else
      index = index + 1
    end
  end
end

function refLabel(type, inline)
  if inline.text then
    return string.match(inline.text, "^" .. refLabelPattern(type) .. "$")
  else
    return nil
  end
end

function extractRefLabel(type, text)
  return string.match(text, "^(.*)" .. refLabelPattern(type) .. "$")
end

function refLabelPattern(type)
  return "{#(" .. type .. "%-[^ }]+)}"
end

function isValidRefType(type) 
  return tcontains(validRefTypes(), type)
end

function validRefTypes()
  local types = tkeys(theoremTypes)
  table.insert(types, "fig")
  table.insert(types, "tbl")
  table.insert(types, "eq")
  table.insert(types, "lst")
  table.insert(types, "sec")
  return types
end


-- qmd.lua
-- Copyright (C) 2020 by RStudio, PBC

function isQmdInput()
  return param("crossref-input-type", "md") == "qmd"
end

function qmd()
  if isQmdInput() then
    return {
      -- for qmd, look for label: and fig-cap: inside code block text
      CodeBlock = function(el)
        local label = el.text:match("|%slabel:%s(%a+%-[^\n]+)\n")
        if label ~= nil and (isFigureRef(label) or isTableRef(label)) then
          local type, caption = parseCaption(label, el.text)
          if type == "fig" or type == "tbl" then
            local order = indexNextOrder(type)
            indexAddEntry(label, nil, order, stringToInlines(caption))
          end
        end
        return el
      end
    }
  else
    return {}
  end
end

function parseCaption(label, elText)
  local type, caption = elText:match("|%s(%a+)%-cap:%s(.-)\n")
  if caption ~= nil then
    -- remove enclosing quotes (if any)
    if caption:sub(1, 1) == '"' then
      caption = caption:sub(2, #caption)
    end
    if caption:sub(#caption, #caption) == '"' then
      caption = caption:sub(1, #caption - 1)
    end
    -- replace escaped quotes
    caption = caption:gsub('\\"', '"')

    -- return
    return type, caption
  else
    return nil
  end
  
end

-- theorems.lua
-- Copyright (C) 2020 by RStudio, PBC

-- preprocess theorem to ensure that embedded headings are unnumered
function preprocessTheorems()
  local types = theoremTypes
  return {
    Div = function(el)
      local type = refType(el.attr.identifier)
      if types[type] ~= nil or proofType(el) ~= nil then
        return pandoc.walk_block(el, {
          Header = function(el)
            el.classes:insert("unnumbered")
            return el
          end
        })
      end

    end
  }
end

function theorems()

  local types = theoremTypes

  return {
    Div = function(el)

      local type = refType(el.attr.identifier)
      local theoremType = types[type]
      if theoremType then

        -- add class for type
        el.attr.classes:insert("theorem")
        if theoremType.env ~= "theorem" then
          el.attr.classes:insert(theoremType.env)
        end
        
        -- capture then remove name
        local name = markdownToInlines(el.attr.attributes["name"])
        if not name or #name == 0 then
          name = resolveHeadingCaption(el)
        end
        el.attr.attributes["name"] = nil 
        
        -- add to index
        local label = el.attr.identifier
        local order = indexNextOrder(type)
        indexAddEntry(label, nil, order, name)
        
        -- If this theorem has no content, then create a placeholder
        if #el.content == 0 or el.content[1].t ~= "Para" then
          print("PLACEHOLDER NEEDED")
          tprepend(el.content, {pandoc.Para({pandoc.Str '\u{a0}'})})
        end
      
        if _quarto.format.isLatexOutput() then
          local preamble = pandoc.Para(pandoc.RawInline("latex", 
            "\\begin{" .. theoremType.env .. "}"))
          preamble.content:insert(pandoc.RawInline("latex", "["))
          if name then
            tappend(preamble.content, name) 
          end
          preamble.content:insert(pandoc.RawInline("latex", "]"))
          preamble.content:insert(pandoc.RawInline("latex",
            "\\label{" .. label .. "}")
          )
          el.content:insert(1, preamble)
          el.content:insert(pandoc.Para(pandoc.RawInline("latex", 
            "\\end{" .. theoremType.env .. "}"
          )))
        else
          -- create caption prefix
          local prefix = title(type, theoremType.title)
          table.insert(prefix, pandoc.Space())
          tappend(prefix, numberOption(type, order))
          table.insert(prefix, pandoc.Space())
          if name then
            table.insert(prefix, pandoc.Str("("))
            tappend(prefix, name)
            table.insert(prefix, pandoc.Str(")"))
            table.insert(prefix, pandoc.Space())
          end

          -- prepend the prefix
          local caption = el.content[1]
          local prefix = { 
            pandoc.Span(
              pandoc.Strong(prefix), 
              pandoc.Attr("", { "theorem-title" })
            )
          }

          if caption.content == nil then
            -- https://github.com/quarto-dev/quarto-cli/issues/2228
            -- caption doesn't always have a content field; in that case,
            -- use the parent?
            tprepend(el.content, prefix)
          else
            tprepend(caption.content, prefix)
          end
        end

      else
        -- see if this is a proof, remark, or solution
        local proof = proofType(el)
        if proof ~= nil then

          -- ensure requisite latex is injected
          crossref.usingTheorems = true

          if proof.env ~= "proof" then
            el.attr.classes:insert("proof")
          end

          -- capture then remove name
          local name = markdownToInlines(el.attr.attributes["name"])
          if not name or #name == 0 then
            name = resolveHeadingCaption(el)
          end
          el.attr.attributes["name"] = nil 

          -- output
          if _quarto.format.isLatexOutput() then
            local preamble = pandoc.Para(pandoc.RawInline("latex", 
              "\\begin{" .. proof.env .. "}"))
            if name ~= nil then
              preamble.content:insert(pandoc.RawInline("latex", "["))
              tappend(preamble.content, name)
              preamble.content:insert(pandoc.RawInline("latex", "]"))
            end 
            el.content:insert(1, preamble)
            el.content:insert(pandoc.Para(pandoc.RawInline("latex", 
              "\\end{" .. proof.env .. "}"
            )))
          else
            local span = pandoc.Span(
              { pandoc.Emph(pandoc.Str(envTitle(proof.env, proof.title)))},
              pandoc.Attr("", { "proof-title" })
            )
            if name ~= nil then
              span.content:insert(pandoc.Str(" ("))
              tappend(span.content, name)
              span.content:insert(pandoc.Str(")"))
            end
            tappend(span.content, { pandoc.Str(". ")})
            if #el.content > 0 and 
               el.content[1].content ~= nil and #el.content[1].content > 0 then
              el.content[1].content:insert(1, span)
            else
              -- if the first block can't handle content insertion
              -- then insert a new paragraph
              el.content:insert(1, pandoc.Para{span})
            end
          end

        end

      end
     
      return el
    
    end
  }

end


-- theorem latex includes
function theoremLatexIncludes()
  
  -- determine which theorem types we are using
  local types = theoremTypes
  local refs = tkeys(crossref.index.entries)
  local usingTheorems = crossref.usingTheorems
  for k,v in pairs(crossref.index.entries) do
    local type = refType(k)
    if types[type] then
      usingTheorems = true
      types[type].active = true
    end
  end
  
  -- return requisite latex if we are using theorems
  if usingTheorems then
    local secType 
    if crossrefOption("chapters", false) then 
      secType = "chapter" 
    else 
      secType = "section" 
    end
    local theoremIncludes = "\\usepackage{amsthm}\n"
    for _, type in ipairs(tkeys(types)) do
      if types[type].active then
        theoremIncludes = theoremIncludes .. 
          "\\theoremstyle{" .. types[type].style .. "}\n" ..
          "\\newtheorem{" .. types[type].env .. "}{" .. 
          titleString(type, types[type].title) .. "}[" .. secType .. "]\n"
      end
    end
    theoremIncludes = theoremIncludes ..
      "\\theoremstyle{remark}\n" ..
      "\\renewcommand*{\\proofname}{" .. envTitle("proof", "Proof") .. "}\n" ..
      "\\newtheorem*{remark}{" .. envTitle("remark", "Remark") .. "}\n" ..
      "\\newtheorem*{solution}{" .. envTitle("solution", "Solution") .. "}\n"
    return theoremIncludes
  else
    return nil
  end
end


-- listings.lua
-- Copyright (C) 2020 by RStudio, PBC

-- constants for list attributes
kLstCap = "lst-cap"

-- process all listings
function listings()
  
  return {
    CodeBlock = function(el)
      local label = string.match(el.attr.identifier, "^lst%-[^ ]+$")
      local caption = el.attr.attributes[kLstCap]
      if label and caption then
    
        -- the listing number
        local order = indexNextOrder("lst")
        
        -- generate content from markdown caption
        local captionContent = markdownToInlines(caption)
        
        -- add the listing to the index
        indexAddEntry(label, nil, order, captionContent)
       
        if _quarto.format.isLatexOutput() then

          -- add listing class to the code block
          el.attr.classes:insert("listing")

          -- if we are use the listings package we don't need to do anything
          -- further, otherwise generate the listing div and return it
          if not latexListings() then
            local listingDiv = pandoc.Div({})
            listingDiv.content:insert(pandoc.RawBlock("latex", "\\begin{codelisting}"))
            local listingCaption = pandoc.Plain({pandoc.RawInline("latex", "\\caption{")})
            listingCaption.content:extend(captionContent)
            listingCaption.content:insert(pandoc.RawInline("latex", "}"))
            listingDiv.content:insert(listingCaption)
            listingDiv.content:insert(el)
            listingDiv.content:insert(pandoc.RawBlock("latex", "\\end{codelisting}"))
            return listingDiv
          end

        else
         
           -- Prepend the title
          tprepend(captionContent, listingTitlePrefix(order))

          -- return a div with the listing
          return pandoc.Div(
            {
              pandoc.Para(captionContent),
              el
            },
            pandoc.Attr(label, {"listing"})
          )
        end

      end
      
      --  if we get this far then just reflect back the el
      return el
    end
  }

end

function listingTitlePrefix(order)
  return titlePrefix("lst", "Listing", order)
end


function latexListings()
  return param("listings", false)
end

-- equations.lua
-- Copyright (C) 2020 by RStudio, PBC

-- process all equations
function equations()
  return {
    Para = processEquations,
    Plain = processEquations
  }
end

function processEquations(blockEl)

  -- alias inlines
  local inlines = blockEl.content

  -- do nothing if there is no math herein
  if inlines:find_if(isDisplayMath) == nil then
    return blockEl
  end

  local mathInlines = nil
  local targetInlines = pandoc.List()

  for i, el in ipairs(inlines) do

    -- see if we need special handling for pending math, if
    -- we do then track whether we should still process the
    -- inline at the end of the loop
    local processInline = true
    if mathInlines then
      if el.t == "Space" then
        mathInlines:insert(el)
        processInline = false
      elseif el.t == "Str" and refLabel("eq", el) then

        -- add to the index
        local label = refLabel("eq", el)
        local order = indexNextOrder("eq")
        indexAddEntry(label, nil, order)

        -- get the equation
        local eq = mathInlines[1]

        -- write equation
        if _quarto.format.isLatexOutput() then
          targetInlines:insert(pandoc.RawInline("latex", "\\begin{equation}"))
          targetInlines:insert(pandoc.Span(pandoc.RawInline("latex", eq.text), pandoc.Attr(label)))
          targetInlines:insert(pandoc.RawInline("latex", "\\label{" .. label .. "}\\end{equation}"))
        else
          local eqNumber = eqQquad
          local mathMethod = param("html-math-method", nil)
          if _quarto.format.isHtmlOutput() and (mathMethod == "mathjax" or mathMethod == "katex") then
            eqNumber = eqTag
          end
          eq.text = eq.text .. " " .. eqNumber(inlinesToString(numberOption("eq", order)))
          local span = pandoc.Span(eq, pandoc.Attr(label))
          targetInlines:insert(span)
        end

        -- reset state
        mathInlines = nil
        processInline = false
      else
        targetInlines:extend(mathInlines)
        mathInlines = nil
      end
    end

    -- process the inline unless it was already taken care of above
    if processInline then
      if isDisplayMath(el) then
          mathInlines = pandoc.List()
          mathInlines:insert(el)
        else
          targetInlines:insert(el)
      end
    end

  end

  -- flush any pending math inlines
  if mathInlines then
    targetInlines:extend(mathInlines)
  end

  -- return the processed list
  blockEl.content = targetInlines
  return blockEl
 
end

function eqTag(eq)
  return "\\tag{" .. eq .. "}"
end

function eqQquad(eq)
  return "\\qquad(" .. eq .. ")"
end

function isDisplayMath(el)
  return el.t == "Math" and el.mathtype == "DisplayMath"
end

-- tables.lua
-- Copyright (C) 2020 by RStudio, PBC

-- process all tables (note that cross referenced tables are *always*
-- wrapped in a div so they can carry parent information and so that
-- we can create a hyperef target for latex)
function tables()
  return {
    Div = function(el)
      if isTableDiv(el) and isReferenceableTbl(el) then
        
        -- are we a parent of subrefs? If so then process the caption
        -- at the bottom of the div
        if hasSubRefs(el, "tbl") then
          
          local caption = refCaptionFromDiv(el)
          if not caption then
            caption = pandoc.Para(noCaption())
            el.content:insert(caption)
          end
          local captionClone = caption:clone().content
          local label = el.attr.identifier
          local order = indexNextOrder("tbl")
          prependTitlePrefix(caption, label, order)
          indexAddEntry(label, nil, order, captionClone)
          
        else
          -- look for various ways of expressing tables in a div
          local processors = { processMarkdownTable, processRawTable }
          for _, process in ipairs(processors) do
            local tblDiv = process(el)
            if tblDiv then
              return tblDiv
            end
          end
        end
      end
      -- default to just reflecting the div back
      return el
    end
  }
end

function preprocessRawTableBlock(rawEl, parentId)
  
  function divWrap(el, label, caption)
    local div = pandoc.Div(el, pandoc.Attr(label))
    if parentId then
      div.attr.attributes[kRefParent] = parentId
      if caption then
        div.content:insert(pandoc.Para(stringToInlines(caption)))
      end
    end
    return div
  end
  
  if _quarto.format.isRawHtml(rawEl) and _quarto.format.isHtmlOutput() then
    local captionPattern = htmlTableCaptionPattern()
    local _, caption, _ = string.match(rawEl.text, captionPattern) 
    if caption then
      -- extract id if there is one
      local caption, label = extractRefLabel("tbl", caption)
      if label then
        -- remove label from caption
        rawEl.text = rawEl.text:gsub(captionPattern, "%1" .. caption:gsub("%%", "%%%%") .. "%3", 1)
      elseif parentId then
        label = autoRefLabel(parentId)
      end
        
      if label then
        return divWrap(rawEl, label)
      end
    end
  elseif _quarto.format.isRawLatex(rawEl) and _quarto.format.isLatexOutput() then
    
    -- remove knitr label
    local knitrLabelPattern = "\\label{tab:[^}]+} ?"
    rawEl.text = rawEl.text:gsub(knitrLabelPattern, "", 1)
    
    -- try to find a caption with an id
    local captionPattern = "(\\caption{)(.*)" .. refLabelPattern("tbl") .. "([^}]*})"
    local _, caption, label, _ = rawEl.text:match(captionPattern)
    if label then
      -- remove label from caption
      rawEl.text = rawEl.text:gsub(captionPattern, "%1%2%4", 1)
    elseif parentId then
      label = autoRefLabel(parentId)
    end
      
    if label then
      return divWrap(rawEl, label)
    end
      
  end
  
  return rawEl
  
end

function preprocessTable(el, parentId)
  
 -- if there is a caption then check it for a table suffix
  if el.caption.long ~= nil then
    local last = el.caption.long[#el.caption.long]
    if last and #last.content > 0 then
       -- check for tbl label
      local label = nil
      local caption, attr = parseTableCaption(last.content)
      if startsWith(attr.identifier, "tbl-") then
        -- set the label and remove it from the caption
        label = attr.identifier
        attr.identifier = ""
        last.content = createTableCaption(caption, attr)
   
        -- provide error caption if there is none
        if #last.content == 0 then
          if parentId then
            tappend(last.content, { emptyCaption() })
          else
            tappend(last.content, { noCaption() })
          end
        end
        
      -- if there is a parent then auto-assign a label if there is none 
      elseif parentId then
        label = autoRefLabel(parentId)
      end
     
      if label then
        -- wrap in a div with the label (so that we have a target
        -- for the tbl ref, in LaTeX that will be a hypertarget)
        local div = pandoc.Div(el, pandoc.Attr(label))
        
        -- propagate parent id if the parent is a table
        if parentId and isTableRef(parentId) then
          div.attr.attributes[kRefParent] = parentId
        end
        
        -- return the div
        return div
      end
    end
  end
  return el
end


function processMarkdownTable(divEl)
  for i,el in pairs(divEl.content) do
    if el.t == "Table" then
      if el.caption.long ~= nil and #el.caption.long > 0 then
        local label = divEl.attr.identifier
        local caption = el.caption.long[#el.caption.long]
        processMarkdownTableEntry(divEl, el, label, caption)
        return divEl
      end
    end
  end
  return nil
end

function processMarkdownTableEntry(divEl, el, label, caption)
  
  -- clone the caption so we can add a clean copy to our index
  local captionClone = caption.content:clone()

  -- determine order / insert prefix
  local order
  local parent = divEl.attr.attributes[kRefParent]
  if (parent) then
    order = nextSubrefOrder()
    prependSubrefNumber(caption.content, order)
  else
    order = indexNextOrder("tbl")
    prependTitlePrefix(caption, label, order)
  end

  -- add the table to the index
  indexAddEntry(label, parent, order, captionClone)
  
end



function processRawTable(divEl)
  -- look for a raw html or latex table
  for i,el in pairs(divEl.content) do
    local rawParentEl, rawEl, rawIndex = rawElement(divEl, el, i)
    if rawEl then
      local label = divEl.attr.identifier
      -- html table
      if _quarto.format.isRawHtml(rawEl) then
        local captionPattern = htmlTableCaptionPattern()
        local _, caption, _ = string.match(rawEl.text, captionPattern)
        if caption then
          
          local order
          local prefix
          local parent = divEl.attr.attributes[kRefParent]
          if (parent) then
            order = nextSubrefOrder()
            local subref = pandoc.List()
            prependSubrefNumber(subref, order)
            prefix = inlinesToString(subref)
          else
            order = indexNextOrder("tbl")
            prefix = pandoc.utils.stringify(tableTitlePrefix(order))
          end
          
          indexAddEntry(label, parent, order, stringToInlines(caption))
        
          rawEl.text = rawEl.text:gsub(captionPattern, "%1" .. prefix .. " %2%3", 1)
          rawParentEl.content[rawIndex] = rawEl
          return divEl
        end
      -- latex table
      elseif _quarto.format.isRawLatex(rawEl) then
        
        -- look for raw latex with a caption
        captionPattern = "\\caption{([^}]+)}"
        caption = string.match(rawEl.text, captionPattern)
        if caption then
           processLatexTable(divEl, rawEl, captionPattern, label, caption)
           rawParentEl.content[rawIndex] = rawEl
           return divEl
        end
      end
      break
    end
  end

  return nil
end

-- handle either a raw block or raw inline in first paragraph
function rawElement(divEl, el, index)
  if el.t == "RawBlock" then
    return divEl, el, index
  elseif el.t == "Para" and #el.content > 0 and el.content[1].t == "RawInline" then
    return el, el.content[1], 1
  end
end

-- is this a Div containing a table?
function isTableDiv(el)
  return el.t == "Div" and hasTableRef(el)
end


function tableTitlePrefix(order)
  return titlePrefix("tbl", "Table", order)
end


function processLatexTable(divEl, el, captionPattern, label, caption)
  
  local order
  local parent = divEl.attr.attributes[kRefParent]
  if (parent) then
    el.text = el.text:gsub(captionPattern, "", 1)
    divEl.content:insert(pandoc.Para(stringToInlines(caption)))
    order = nextSubrefOrder()
  else
    el.text = el.text:gsub(captionPattern, "\\caption{\\label{" .. label .. "}" .. caption:gsub("%%", "%%%%") .. "}", 1)
    order = indexNextOrder("tbl")
  end
  
  indexAddEntry(label, parent, order, stringToInlines(caption))
end

function prependTitlePrefix(caption, label, order)
  if _quarto.format.isLatexOutput() then
     tprepend(caption.content, {
       pandoc.RawInline('latex', '\\label{' .. label .. '}')
     })
  else
     tprepend(caption.content, tableTitlePrefix(order))
  end
end



-- figures.lua
-- Copyright (C) 2020 by RStudio, PBC

-- process all figures
function figures()
  return {
    Div = function(el)
      if isFigureDiv(el) and isReferenceableFig(el) then
        local caption = refCaptionFromDiv(el)
        if caption then
          processFigure(el, caption.content)
        end
      end
      return el
    end,

    Para = function(el)
      local image = discoverFigure(el)
      if image and isFigureImage(image) then
        processFigure(image, image.caption)
      end
      return el
    end
  }
end


-- process a figure, re-writing it's caption as necessary and
-- adding it to the global index of figures
function processFigure(el, captionContent)
  -- get label and base caption
  local label = el.attr.identifier
  local caption = captionContent:clone()

  -- determine order, parent, and displayed caption
  local order
  local parent = el.attr.attributes[kRefParent]
  if (parent) then
    order = nextSubrefOrder()
    prependSubrefNumber(captionContent, order)
  else
    order = indexNextOrder("fig")
    if _quarto.format.isLatexOutput() then
      tprepend(captionContent, {
        pandoc.RawInline('latex', '\\label{' .. label .. '}')
      })
    else
      tprepend(captionContent, figureTitlePrefix(order))
    end
  end

  -- update the index
  indexAddEntry(label, parent, order, caption)
end


function figureTitlePrefix(order)
  return titlePrefix("fig", param("crossref-fig-title", "Figure"), order)
end

-- sections.lua
-- Copyright (C) 2020 by RStudio, PBC

function sections()
  
  return {
    Header = function(el)
      
      -- index the heading
      indexAddHeading(el.attr.identifier)

      -- skip unnumbered
      if (el.classes:find("unnumbered")) then
        return el
      end
      
      -- cap levels at 7
      local level = math.min(el.level, 7)
      
      -- get the current level
      local currentLevel = currentSectionLevel()
      
      -- if this level is less than the current level
      -- then set subsequent levels to their offset
      if level < currentLevel then
        for i=level+1,#crossref.index.section do
          crossref.index.section[i] = crossref.index.sectionOffsets[i]
        end
      end
      
      -- increment the level counter
      crossref.index.section[level] = crossref.index.section[level] + 1
      
      -- if this is a chapter then notify the index (will be used to 
      -- reset type-counters if we are in "chapters" mode)
      if level == 1 then
        indexNextChapter(crossref.index.section[level], currentFileMetadataState().appendix)
      end
      
      -- if this has a section identifier then index it
      if refType(el.attr.identifier) == "sec" then
        local order = indexNextOrder("sec")
        indexAddEntry(el.attr.identifier, nil, order, el.content, currentFileMetadataState().appendix)
      end

      -- if the number sections option is enabled then emulate pandoc numbering
      local section = sectionNumber(crossref.index.section, level)
      if numberSectionsOptionEnabled() and level <= numberDepth() then
        el.attr.attributes["number"] = section
      end
      
      -- number the section if required
      if (numberSections() and level <= numberDepth()) then
        local appendix = (level == 1) and currentFileMetadataState().appendix
        if appendix then
          el.content:insert(1, pandoc.Space())
          tprepend(el.content, crossrefOption("appendix-delim", stringToInlines(" —")))
        elseif level == 1 and not _quarto.format.isHtmlOutput() then
          el.content:insert(1, pandoc.Str(". "))
        else
          el.content:insert(1, pandoc.Space())
        end

        if _quarto.format.isHtmlOutput() then
          el.content:insert(1, pandoc.Span(
            stringToInlines(section),
            pandoc.Attr("", { "header-section-number"})
          ))
        else
          tprepend(el.content, stringToInlines(section))
        end

        if appendix then
          el.content:insert(1, pandoc.Space())
          tprepend(el.content, crossrefOption("appendix-title", stringToInlines("Appendix")))
        end

      end
      
      -- return 
      return el
    end
  }
end

function currentSectionLevel()
  -- scan backwards for the first non-zero section level
  for i=#crossref.index.section,1,-1 do
    local section = crossref.index.section[i]
    if section ~= 0 then
      return i
    end
  end
  
  -- if we didn't find one then we are at zero (no sections yet)
  return 0
end

function numberSections()
  return not _quarto.format.isLatexOutput() and 
         not _quarto.format.isMarkdownOutput() 
         and numberSectionsOptionEnabled()
end

function numberSectionsOptionEnabled()
  return param("number-sections", false)
end

function numberDepth() 
  return param("number-depth", 6)
end


-- preprocess.lua
-- Copyright (C) 2020 by RStudio, PBC

-- figures and tables support sub-references. mark them up before
-- we proceed with crawling for cross-refs
function preprocess()
  
  return {

    Header = function(el)
      crossref.maxHeading = math.min(crossref.maxHeading, el.level)
    end,

    Pandoc = function(doc)
      
      -- initialize autolabels table
      crossref.autolabels = pandoc.List()
      
      local walkRefs
      walkRefs = function(parentId)
        return {
          Div = function(el)
            if hasFigureOrTableRef(el) then
              
              -- provide error caption if there is none
              if not refCaptionFromDiv(el) then
                local err = pandoc.Para(noCaption())
                el.content:insert(err)
              end
              
              if parentId ~= nil then
                if refType(el.attr.identifier) == refType(parentId) then
                  el.attr.attributes[kRefParent] = parentId
                end
              else
                -- mark as table parent if required
                if isTableRef(el.attr.identifier) then
                  el.attr.classes:insert("tbl-parent")
                end
                el = pandoc.walk_block(el, walkRefs(el.attr.identifier))
              end
            end
            return el
          end,

          Table = function(el)
            return preprocessTable(el, parentId)
          end,
          
          RawBlock = function(el)
            return preprocessRawTableBlock(el, parentId)
          end,

          Para = function(el)
            
            -- provide error caption if there is none
            local fig = discoverFigure(el, false)
            if fig and hasFigureRef(fig) and #fig.caption == 0 then
              if isFigureRef(parentId) then
                fig.caption:insert(emptyCaption())
                fig.title = "fig:" .. fig.title
              else
                fig.caption:insert(noCaption())
              end
            end
            
            -- if we have a parent fig: then mark it's sub-refs
            if parentId and isFigureRef(parentId) then
              local image = discoverFigure(el)
              if image and isFigureImage(image) then
                image.attr.attributes[kRefParent] = parentId
              end
            end
            
            return el
          end
        }
      end

      -- walk all blocks in the document
      for i,el in pairs(doc.blocks) do
      
        -- always wrap referenced tables in a div
        if el.t == "Table" then
          doc.blocks[i] = preprocessTable(el, nil)
        elseif el.t == "RawBlock" then
          doc.blocks[i] = preprocessRawTableBlock(el, nil)
        elseif el.t ~= "Header" then
          local parentId = nil
          if hasFigureOrTableRef(el) and el.content ~= nil then
            parentId = el.attr.identifier

            -- mark as parent
            if isTableRef(el.attr.identifier) then
              el.attr.classes:insert("tbl-parent")
            end
            
            -- provide error caption if there is none
            if not refCaptionFromDiv(el) then
              local err = pandoc.Para(noCaption())
              el.content:insert(err)
            end
          end
          doc.blocks[i] = pandoc.walk_block(el, walkRefs(parentId))
        end
      end

      return doc

    end
  }
end




-- index.lua
-- Copyright (C) 2020 by RStudio, PBC

-- initialize the index
function initIndex()
     
  -- compute section offsets
  local sectionOffsets = pandoc.List({0,0,0,0,0,0,0})
  local numberOffset = pandoc.List(param("number-offset", {}))
  for i=1,#sectionOffsets do
    if i > #numberOffset then
      break
    end
    sectionOffsets[i] = numberOffset[i]
  end
  
  -- initialize index
  crossref.index = {
    nextOrder = {},
    nextSubrefOrder = 1,
    section = sectionOffsets:clone(),
    sectionOffsets = sectionOffsets:clone(),
    numberOffset = sectionOffsets:clone(),
    entries = {},
    headings = pandoc.List()
  }
  
end


-- advance a chapter
function indexNextChapter(index, appendix)
   -- reset nextOrder to 1 for all types if we are in chapters mode
  if crossrefOption("chapters", false) then
    -- reset all of the cross type counters
    for k,v in pairs(crossref.index.nextOrder) do
      crossref.index.nextOrder[k] = 1
    end
  end
  -- if this is an appendix the note the start index
  if appendix == true and crossref.startAppendix == nil then
    crossref.startAppendix = index
  end
end

-- next sequence in index for type
function indexNextOrder(type)
  if not crossref.index.nextOrder[type] then
    crossref.index.nextOrder[type] = 1
  end
  local nextOrder = crossref.index.nextOrder[type]
  crossref.index.nextOrder[type] = crossref.index.nextOrder[type] + 1
  crossref.index.nextSubrefOrder = 1
  return {
    section = crossref.index.section:clone(),
    order = nextOrder
  }
end

function indexAddHeading(identifier)
  if identifier ~= nil and identifier ~= '' then
    crossref.index.headings:insert(identifier)
  end
end

-- add an entry to the index
function indexAddEntry(label, parent, order, caption, appendix)
  if caption ~= nil then
    caption = pandoc.List(caption)
  end
  crossref.index.entries[label] = {
    parent = parent,
    order = order,
    caption = caption,
    appendix = appendix
  }
end

-- advance a subref
function nextSubrefOrder()
  local order = { section = nil, order = crossref.index.nextSubrefOrder }
  crossref.index.nextSubrefOrder = crossref.index.nextSubrefOrder + 1
  return order
end

-- does our index already contain this element?
function indexHasElement(el)
  return crossref.index.entries[el.attr.identifier] ~= nil
end


-- filter to write the index
function writeIndex()
  return {
    Pandoc = function(doc)
      local indexFile = param("crossref-index-file")
      if indexFile ~= nil then
        if isQmdInput() then
          writeKeysIndex(indexFile)
        else
          writeFullIndex(indexFile)
        end   
      end
    end
  }
end

function writeKeysIndex(indexFile)
  local index = {
    entries = pandoc.List(),
  }
  for k,v in pairs(crossref.index.entries) do
    -- create entry 
    local entry = {
      key = k,
    }
    -- add caption if we have one
    if v.caption ~= nil then
      entry.caption = inlinesToString(v.caption)
    else
      entry.caption = ""
    end
    -- add entry
    index.entries:insert(entry)
  end
 
  -- write the index
  local json = quarto.json.encode(index)
  local file = io.open(indexFile, "w")
  if file then
    file:write(json)
    file:close()
  else
    warn('Error attempting to write crossref index')
  end
end


function writeFullIndex(indexFile)
  -- create an index data structure to serialize for this file 
  local index = {
    entries = pandoc.List(),
    headings = crossref.index.headings:clone()
  }

  -- add options if we have them
  if next(crossref.options) then
    index.options = {}
    for k,v in pairs(crossref.options) do
      if type(v) == "table" then
        if tisarray(v) and pandoc.utils.type(v) ~= "Inlines" then
          index.options[k] = v:map(function(item) return pandoc.utils.stringify(item) end)
        else
          index.options[k] = pandoc.utils.stringify(v)
        end
      else
        index.options[k] = v
      end
    end
  end

  -- write a special entry if this is a multi-file chapter with an id
  local chapterId = crossrefOption("chapter-id")
  
  if chapterId then
    chapterId = pandoc.utils.stringify(chapterId)

     -- chapter heading
    index.headings:insert(chapterId)

    -- chapter entry
    if refType(chapterId) == "sec" and param("number-offset") ~= nil then
      local chapterEntry = {
        key = chapterId,
        parent = nil,
        order = {
          number = 1,
          section = crossref.index.numberOffset
        }
      }
      index.entries:insert(chapterEntry)
    end
  end

  for k,v in pairs(crossref.index.entries) do
    -- create entry 
    local entry = {
      key = k,
      parent = v.parent,
      order = {
        number = v.order.order,
      }
    }
    -- add caption if we have one
    if v.caption ~= nil then
      entry.caption = inlinesToString(v.caption)
    else
      entry.caption = ""
    end
    -- add section if we have one
    if v.order.section ~= nil then
      entry.order.section = v.order.section
    end
    -- add entry
    index.entries:insert(entry)
  end
 
  -- write the index
  local json = quarto.json.encode(index)
  local file = io.open(indexFile, "w")
  if file then
    file:write(json)
    file:close()
  else
    warn('Error attempting to write crossref index')
  end
end

-- crossref.lua
-- Copyright (C) 2020 by RStudio, PBC

-- required version
PANDOC_VERSION:must_be_at_least '2.13'


-- global crossref state
crossref = {
  usingTheorems = false,
  startAppendix = nil
}



initIndex()

-- chain of filters
return {
  initCrossrefOptions(),
  preprocess(),
  preprocessTheorems(),
  combineFilters({
    fileMetadata(),
    qmd(),
    sections(),
    figures(),
    tables(),
    equations(),
    listings(),
    theorems(),
  }),
  resolveRefs(),
  crossrefMetaInject(),
  writeIndex()
}

