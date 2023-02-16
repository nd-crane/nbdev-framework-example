-- project_paths.lua
-- Copyright (C) 2020 by RStudio, PBC


kProjectResolverIgnore = 'project-resolve-ignore'

local function resolveProjectPath(path)
  local offset = _quarto.projectOffset()
  if offset and path and startsWith(path, '/') then
    return pandoc.path.join({offset, pandoc.text.sub(path, 2, #path)})
  else
    return nil
  end
end

-- resources that have '/' prefixed paths are treated as project
-- relative paths if there is a project context. For HTML output, 
-- these elements are dealt with in a post processor in website-resources.ts:resolveTag()
-- but for non-HTML output, we fix these here.
function projectPaths()
  return {
    Image = function(el)
      if el.attr.attributes[kProjectResolverIgnore] then
        el.attr.attributes[kProjectResolverIgnore] = ''
        return el
      end

      local resolved = false

      -- Resolve the image source
      if el.src then
        local resolvedPath = resolveProjectPath(el.src)
        if resolvedPath ~= nil then
          el.src = resolvedPath;
          resolved = true
        end
      end

      -- Resolve image data-src
      if el.attributes['data-src'] then
        local resolvedPath = resolveProjectPath(el.src)
        if resolvedPath ~= nil then
          el.attributes['data-src'] = resolvedPath;
          resolved = true
        end
      end

      if resolved then
        return el
      end
    end,

    Link = function(el)
      if el.attr.attributes[kProjectResolverIgnore] then
        el.attr.attributes[kProjectResolverIgnore] = ''
        return el
      end

      if el.href then
        local resolvedHref = resolveProjectPath(el.href)
        if resolvedHref then
          el.href = resolvedHref
          return el
        end
      end
    end
  }
end



-- input-traits.lua
-- Copyright (C) 2020 by RStudio, PBC


function addInputTrait(key, value)
  preState.results.inputTraits[key] = value
end

local kPositionedRefs = 'positioned-refs'
function inputTraits() 
  return {
    Div = function(el) 
      local hasPositionedRefs = el.attr.identifier == 'refs'
      if (hasPositionedRefs) then
        addInputTrait(kPositionedRefs, true) 
      end
    end
  }
end

-- include-paths.lua
--
-- fixes paths from <include> directives
--
-- Copyright (C) 2022 by RStudio, PBC

function includePaths() 
  return {
    Link = function(el)
      local file = currentFileMetadataState().file
      if file ~= nil and file.include_directory ~= nil then
        el.target = fixIncludePath(el.target, file.include_directory)
      end
      return el
    end,

    Image = function(el)
      local file = currentFileMetadataState().file
      if file ~= nil and file.include_directory ~= nil then 
        el.src = fixIncludePath(el.src, file.include_directory)
      end
      return el
    end,

    RawInline = handleRawElementIncludePath,
    RawBlock = handleRawElementIncludePath,
  }
end


function handleRawElementIncludePath(el)
  if _quarto.format.isRawHtml(el) then
    local file = currentFileMetadataState().file
    if file ~= nil and file.include_directory ~= nil then
      handlePaths(el, file.include_directory, fixIncludePath)
    end
    return el
  end
end

-- output-location.lua
-- Copyright (C) 2021 by RStudio, PBC

local function collectCellOutputLocation(el)
  if el.t == "Div" and 
     el.attr.classes:includes("cell")  then
    local outputLoc = el.attr.attributes["output-location"]
    el.attr.attributes["output-location"] = nil 
    return outputLoc
  else
    return nil
  end
        
end

local function outputLocationCellHasCode(el)
  return #el.content > 0 and
         el.content[1].t == "CodeBlock" and
         el.content[1].attr.classes:includes("cell-code")  
end

-- note: assumes that outputLocationCellHasCode has been called
local function partitionCell(el, outputClass)
  local codeDiv = pandoc.Div({ el.content[1] }, el.attr)
  local outputDiv = pandoc.Div(tslice(el.content, 2, #el.content), el.attr)
  outputDiv.attr.identifier = ""
  outputDiv.attr.classes:insert(outputClass)
  return { codeDiv, outputDiv }
end

local function fragmentOutputLocation(block)
  return partitionCell(block, "fragment")
end

local function slideOutputLocation(block)
  return partitionCell(block, "output-location-slide")
end

local function columnOutputLocation(el, fragment)
  local codeDiv = pandoc.Div({ el.content[1] })
  local outputDiv = pandoc.Div(tslice(el.content, 2, #el.content))
  codeDiv.attr.classes:insert("column")
  outputDiv.attr.identifier = ""
  outputDiv.attr.classes:insert("column")
  if fragment then
    outputDiv.attr.classes:insert("fragment")
  end
  local columnsDiv = pandoc.Div( {codeDiv, outputDiv}, el.attr )
  tappend(columnsDiv.attr.classes, {
    "columns", "column-output-location"
  })
  return { columnsDiv }
end

function outputLocation()
  if _quarto.format.isRevealJsOutput() then
    return {
      Blocks = function(blocks)
        local newBlocks = pandoc.List()
        for _,block in pairs(blocks) do
          local outputLoc = collectCellOutputLocation(block)
          if outputLoc then
            if outputLocationCellHasCode(block) then
              if outputLoc == "fragment" then
                tappend(newBlocks, fragmentOutputLocation(block))
              elseif outputLoc == "column" then
                tappend(newBlocks, columnOutputLocation(block))
              elseif outputLoc == "column-fragment" then
                tappend(newBlocks, columnOutputLocation(block, true))
              elseif outputLoc == "slide" then
                tappend(newBlocks, slideOutputLocation(block))
              else
                newBlocks:insert(block)
              end
            else
              warn("output-location is only valid for cells that echo their code")
              newBlocks:insert(block)
            end
          else
            newBlocks:insert(block)
          end
        end
        return newBlocks
      end
    }
  else
    return {}
  end
 
end





-- line-numbers.lua
-- Copyright (C) 2020 by RStudio, PBC


function lineNumbers()
  return {
    CodeBlock = function(el)
      if #el.attr.classes > 0 then
        local lineNumbers = lineNumbersAttribute(el)
        if lineNumbers ~= false then
          -- use the pandoc line numbering class
          el.attr.classes:insert("number-lines")
          -- remove for all formats except reveal
          if not _quarto.format.isRevealJsOutput() then
            el.attr.attributes["code-line-numbers"] = nil
          end
          return el
        end
      end
    end
  }
end

function lineNumbersAttribute(el)
  local default = param("code-line-numbers", false)
  local lineNumbers = attribute(el, "code-line-numbers", default)
  if lineNumbers == true or lineNumbers == "true" or lineNumbers == "1" then
    return true
  elseif lineNumbers == false or lineNumbers == "false" or lineNumbers == "0" then
    return false
  else
    return tostring(lineNumbers)
  end
end

-- content-hidden.lua
-- Copyright (C) 2022 by RStudio, PBC


local kContentVisible = "content-visible"
local kContentHidden = "content-hidden"
local kWhenFormat = "when-format"
local kUnlessFormat = "unless-format"
local kWhenProfile = "when-profile"
local kUnlessProfile = "unless-profile"

function contentHidden()
  local profiles = pandoc.List(param("quarto_profile", {}))
  return {
    Div = handleHiddenVisible(profiles),
    CodeBlock = handleHiddenVisible(profiles),
    Span = handleHiddenVisible(profiles)
  }
end

function handleHiddenVisible(profiles)
  return function(el)
    if el.attr.classes:find(kContentVisible) then
      return handleVisible(el, profiles)
    elseif el.attr.classes:find(kContentHidden) then
      return handleHidden(el, profiles)
    else
      return el
    end
  end
end

function attributesMatch(el, profiles)
  local match = true
  if el.attributes[kWhenFormat] ~= nil then
    match = match and _quarto.format.isFormat(el.attributes[kWhenFormat])
  end
  if el.attributes[kUnlessFormat] ~= nil then
    match = match and not _quarto.format.isFormat(el.attributes[kUnlessFormat])
  end
  if el.attributes[kWhenProfile] ~= nil then
    match = match and profiles:includes(el.attributes[kWhenProfile])
  end
  if el.attributes[kUnlessProfile] ~= nil then
    match = match and not profiles:includes(el.attributes[kUnlessProfile])
  end
  return match
end

function clearHiddenVisibleAttributes(el)
  el.attributes[kUnlessFormat] = nil
  el.attributes[kWhenFormat] = nil
  el.attributes[kUnlessProfile] = nil
  el.attributes[kWhenProfile] = nil
  el.attr.classes = removeClass(el.attr.classes, kContentVisible)
  el.attr.classes = removeClass(el.attr.classes, kContentHidden)
end

function handleVisible(el, profiles)
  local show = attributesMatch(el, profiles)
  clearHiddenVisibleAttributes(el)
  if not show then
    if el.t == "Span" then
      return pandoc.Span({})
    else
      return pandoc.Null()
    end
  end
  return el
end

function handleHidden(el, profiles)
  local hide = attributesMatch(el, profiles)
  clearHiddenVisibleAttributes(el)
  if hide then
    if el.t == "Span" then
      return pandoc.Span({})
    else
      return pandoc.Null()
    end
  end
  return el
end

-- hidden.lua
-- Copyright (C) 2020 by RStudio, PBC

function hidden()
  if (param("keep-hidden", false)) then
    return {
      Div = stripHidden,
      CodeBlock = stripHidden
    }
  else
    return {

    }
  end
end

function stripHidden(el)
  if not _quarto.format.isHtmlOutput() and el.attr.classes:find("hidden") then
    return pandoc.Null()
  end
end

-- panel-layout.lua
-- Copyright (C) 2021 by RStudio, PBC

function panelLayout() 

  return {
    Div = function(el)
      if (hasBootstrap() and el.t == "Div") then
        local fill = el.attr.classes:find("panel-fill")
        local center = el.attr.classes:find("panel-center")
        if fill or center then
          local layoutClass =  fill and "panel-fill" or "panel-center"
          local div = pandoc.Div({ el })
          el.attr.classes = el.attr.classes:filter(function(clz) return clz ~= layoutClass end)
          if fill then
            tappend(div.attr.classes, {
              "g-col-24",
            })
          elseif center then
            tappend(div.attr.classes, {
              "g-col-24",
              "g-col-lg-20",
              "g-start-lg-2"
            })
          end
          -- return wrapped in a raw
          return pandoc.Div({ div }, pandoc.Attr("", { 
            layoutClass,
            "panel-grid"
          }))
        end
      end
      return el
    end
  }
  
end


-- panel-input.lua
-- Copyright (C) 2021 by RStudio, PBC

function panelInput() 

  return {
    Div = function(el)
      if hasBootstrap() and el.attr.classes:find("panel-input") then
        tappend(el.attr.classes, {
          "card",
          "bg-light",
          "p-2",
        })
      end
      return el
    end
  }


end


-- panel-tabset.lua
-- Copyright (C) 2021 by RStudio, PBC

local tabsetidx = 1

function panelTabset() 
  return {
    -- tabsets and callouts
    Div = function(div)
      if div.attr.classes:find("panel-tabset") then
        if hasBootstrap() then
          return tabsetDiv(div, bootstrapTabs())
        elseif _quarto.format.isHtmlOutput() then
          return tabsetDiv(div, tabbyTabs())
        elseif _quarto.format.isLatexOutput() or _quarto.format.isDocxOutput() or _quarto.format.isEpubOutput() then
          return tabsetLatex(div)
        end
      else
        return div
      end  
    end
  }
end


function tabsetDiv(div, renderer)

  -- create a unique id for the tabset
  local tabsetid = "tabset-" .. tabsetidx
  tabsetidx = tabsetidx + 1

  -- find the first heading in the tabset
  local heading = div.content:find_if(function(el) return el.t == "Header" end)
  if heading ~= nil then
    -- note the level, then build tab buckets for content after these levels
    local level = heading.level
    local tabs = pandoc.List()
    local tab = nil
    for i=1,#div.content do 
      local el = div.content[i]
      if el.t == "Header" and el.level == level then
        tab = pandoc.Div({})
        tab.content:insert(el)
        tabs:insert(tab)
      elseif tab ~= nil then
        tab.content:insert(el)
      end
    end

    -- init tab navigation 
    local nav = pandoc.List()
    nav:insert(pandoc.RawInline('html', '<ul ' .. renderer.ulAttribs(tabsetid) .. '>'))

    -- init tab panes
    local panes = pandoc.Div({}, div.attr)
    panes.attr.classes = div.attr.classes:map(function(class) 
      if class == "panel-tabset" then
        return "tab-content" 
      else
        return class
      end
    end)
   
    -- populate
    for i=1,#tabs do
      -- alias tab and heading
      local tab = tabs[i]
      local heading = tab.content[1]
      tab.content:remove(1)

      -- tab id
      local tabid = tabsetid .. "-" .. i
      local tablinkid = tabid .. "-tab"

      -- navigation
      nav:insert(pandoc.RawInline('html', '<li ' .. renderer.liAttribs() .. '>'))
      nav:insert(pandoc.RawInline('html', '<a ' .. renderer.liLinkAttribs(tabid, i==1) .. '>'))
      nav:extend(heading.content)
      nav:insert(pandoc.RawInline('html', '</a></li>'))

      -- pane
      local paneAttr = renderer.paneAttribs(tabid, i==1, heading.attr)
      local pane = pandoc.Div({}, paneAttr)
      pane.content:extend(tab.content)
      panes.content:insert(pane)
    end

    -- end tab navigation
    nav:insert(pandoc.RawInline('html', '</ul>'))

    -- return tabset
    return pandoc.Div({
      pandoc.Plain(nav),
      panes
    }, div.attr:clone())

  end 
end

function bootstrapTabs() 
  return {
    ulAttribs = function(tabsetid)
      return 'class="nav nav-tabs" role="tablist"'
    end,
    liAttribs = function(tabid, isActive)
      return 'class="nav-item" role="presentation"'
    end,
    liLinkAttribs = function(tabid, isActive)
      local tablinkid = tabid .. "-tab"
      local active = ""
      local selected = "false"
      if isActive then
        active = " active"
        selected = "true"
      end
      return 'class="nav-link' .. active .. '" id="' .. tablinkid .. '" data-bs-toggle="tab" data-bs-target="#' .. tabid .. '" role="tab" aria-controls="' .. tabid .. '" aria-selected="' .. selected .. '"'
    end,
    paneAttribs = function(tabid, isActive, headingAttribs)
      local tablinkid = tabid .. "-tab"
      local attribs = headingAttribs:clone()
      attribs.identifier = tabid
      attribs.classes:insert("tab-pane")
      if isActive then
        attribs.classes:insert("active")
      end
      attribs.attributes["role"] = "tabpanel"
      attribs.attributes["aria-labelledby"] = tablinkid
      return attribs
    end
  }
end

function tabbyTabs()
  return {
    ulAttribs = function(tabsetid)
      return 'id="' .. tabsetid .. '" class="panel-tabset-tabby"'
    end,
    liAttribs = function(tabid, isActive)
      return ''
    end,
    liLinkAttribs = function(tabid, isActive)
      local default = ""
      if isActive then
        default = "data-tabby-default "
      end
      return default .. 'href="#' .. tabid .. '"'
    end,
    paneAttribs = function(tabid, isActive, headingAttribs)
      local attribs = headingAttribs:clone()
      attribs.identifier = tabid
      return attribs
    end
  }
end


function tabsetLatex(div)
  -- find the first heading in the tabset
  local heading = div.content:find_if(function(el) return el.t == "Header" end)
  if heading ~= nil then
    local level = heading.level
    if level < 4 then
      heading.level = 4

      for i=1,#div.content do 
        local el = div.content[i]
        if el.t == "Header" and el.level == level then
          el.level = 4
        end
      end 
    end
  end

  return div
end

-- panel-sidebar.lua
-- Copyright (C) 2021 by RStudio, PBC

function panelSidebar() 
  return {
    Blocks = function(blocks)
      if hasBootstrap() or _quarto.format.isRevealJsOutput() then

        -- functions to determine if an element has a layout class
        function isSidebar(el)
          return el ~= nil and el.t == "Div" and el.attr.classes:includes("panel-sidebar")
        end
        function isContainer(el)
          return el ~= nil and
                 el.t == "Div" and 
                 (el.attr.classes:includes("panel-fill") or 
                  el.attr.classes:includes("panel-center") or
                  el.attr.classes:includes("panel-tabset"))
        end
        function isHeader(el)
          return el ~= nil and el.t == "Header"
        end
        function isQuartoHiddenDiv(el)
          return el ~= nil and el.t == "Div" and
                 string.find(el.attr.identifier, "^quarto%-") and
                 el.attr.classes:includes("hidden")
        end
        function isNotQuartoHiddenDiv(el)
          return not isQuartoHiddenDiv(el)
        end

        -- bail if there are no sidebars
        local sidebar, sidebarIdx = blocks:find_if(isSidebar)
        if not sidebar then
          return blocks
        end

        -- create sidebar handler and get attr
        local sidebarHandler = bootstrapSidebar()
        if _quarto.format.isRevealJsOutput() then
          sidebarHandler = revealSidebar()
        end
        local sidebarAttr = sidebarHandler.sidebarAttr()
        local containerAttr = sidebarHandler.containerAttr()
    
        -- filter out quarto hidden blocks (they'll get put back in after processing)
        local quartoHiddenDivs = blocks:filter(isQuartoHiddenDiv)
        blocks = blocks:filter(isNotQuartoHiddenDiv)

        -- locate and arrange sidebars until there are none left
        local sidebar, sidebarIdx = blocks:find_if(isSidebar)
       
        while sidebar ~= nil and sidebarIdx ~= nil do

          -- always transfer sidebar attributes to sidebar
          transferAttr(sidebarAttr, sidebar.attr)

          -- sidebar after container
          if isContainer(blocks[sidebarIdx - 1]) then
            blocks:remove(sidebarIdx)
            local container = blocks:remove(sidebarIdx - 1)
            transferAttr(containerAttr, container.attr)
            blocks:insert(sidebarIdx - 1, 
              pandoc.Div({ container, sidebar }, sidebarHandler.rowAttr({"layout-sidebar-right"}))
            )
          -- sidebar before container
          elseif isContainer(blocks[sidebarIdx + 1]) then
            local container = blocks:remove(sidebarIdx + 1)
            transferAttr(containerAttr, container.attr)
            blocks:remove(sidebarIdx)
            blocks:insert(sidebarIdx, 
              pandoc.Div({ sidebar, container }, sidebarHandler.rowAttr({"layout-sidebar-left"}))
            )
          else
            -- look forward for a header
            local header, headerIdx = blocks:find_if(isHeader, sidebarIdx)
            if header and headerIdx and (headerIdx ~= (sidebarIdx + 1)) then
              local panelBlocks = pandoc.List()
              for i = sidebarIdx + 1, headerIdx - 1, 1 do
                panelBlocks:insert(blocks:remove(sidebarIdx + 1))
              end
              local panelFill = pandoc.Div(panelBlocks, pandoc.Attr("", { "panel-fill" }))
              transferAttr(containerAttr, panelFill)
              blocks:remove(sidebarIdx)
              blocks:insert(sidebarIdx, 
                pandoc.Div({ sidebar,  panelFill }, sidebarHandler.rowAttr({"layout-sidebar-left"}))
              )
            else
              -- look backwards for a header 
              
              headerIdx = nil
              for i = sidebarIdx - 1, 1, -1 do
                if isHeader(blocks[i]) then
                  headerIdx = i
                  break
                end
              end
              -- if we have a header then collect up to it
              if headerIdx ~= nil and (headerIdx ~= (sidebarIdx - 1)) then
                local panelBlocks = pandoc.List()
                for i = headerIdx + 1, sidebarIdx - 1, 1 do
                  panelBlocks:insert(blocks:remove(headerIdx + 1))
                end
                local panelFill = pandoc.Div(panelBlocks,  pandoc.Attr("", { "panel-fill" }))
                transferAttr(containerAttr, panelFill)
                blocks:remove(headerIdx + 1)
                blocks:insert(headerIdx + 1, 
                  pandoc.Div({ panelFill, sidebar }, sidebarHandler.rowAttr({"layout-sidebar-right"}))
                )
              else
                --  no implicit header containment found, strip the sidebar attribute
                sidebar.attr.classes = sidebar.attr.classes:filter(
                  function(clz) 
                    return clz ~= "panel-sidebar" and clz ~= "panel-input"
                  end
                )
              end
            end
          end

          -- try to find another sidebar
          sidebar, sidebarIdx = blocks:find_if(isSidebar)
        end

        -- restore hidden divs and return blocks
        tappend(blocks, quartoHiddenDivs)
        return blocks
      end
    end
  }
end

function bootstrapSidebar()
  return {
    rowAttr = function(classes)
      local attr = pandoc.Attr("", {
        "panel-grid", 
        "layout-sidebar",
        "ms-md-0"
      })
      tappend(attr.classes, classes)
      return attr
    end,
    sidebarAttr = function()
      return pandoc.Attr("", {
        "card",
        "bg-light",
        "p-2",
        "g-col-24",
        "g-col-lg-7"
      })
    end,
    containerAttr = function()
      return pandoc.Attr("", {
        "g-col-24",
        "g-col-lg-17",
        "pt-3",
        "pt-lg-0",
      })
    end
  }
end

function revealSidebar()
  return {
    rowAttr = function(classes) 
      local attr = pandoc.Attr("", { "layout-sidebar" })
      tappend(attr.classes, classes)
      return attr
    end,
    sidebarAttr = function()
      local attr = pandoc.Attr("", {})
      return attr
    end,
    containerAttr = function()
      return pandoc.Attr("")
    end
  }
end

function transferAttr(from, to)
  tappend(to.classes, from.classes)
  for k,v in pairs(from.attributes) do
    to.attributes[k] = v
  end
end

-- engine-escape.lua
-- Copyright (C) 2021 by RStudio, PBC

local kEngineEscapePattern = "{({+([^}]+)}+)}"

function engineEscape()
  return {
    CodeBlock = function(el)

      -- handle code block with 'escaped' language engine
      if #el.attr.classes == 1 then
        local engine, lang = el.attr.classes[1]:match(kEngineEscapePattern)
        if engine then
          el.text = "```" .. engine .. "\n" .. el.text .. "\n" .. "```"
          el.attr.classes[1] = "markdown"
          return el
        end
      end

      -- handle escaped engines within a code block
      el.text = el.text:gsub("```" .. kEngineEscapePattern, function(engine, lang)
        if #el.attr.classes == 0 or not isHighlightClass(el.attr.classes[1]) then
          el.attr.classes:insert(1, "markdown")
        end
        return "```" .. engine 
      end)
      return el
    end
  }
end


local kHighlightClasses = {
  "abc",
  "actionscript",
  "ada",
  "agda",
  "apache",
  "asn1",
  "asp",
  "ats",
  "awk",
  "bash",
  "bibtex",
  "boo",
  "c",
  "changelog",
  "clojure",
  "cmake",
  "coffee",
  "coldfusion",
  "comments",
  "commonlisp",
  "cpp",
  "cs",
  "css",
  "curry",
  "d",
  "default",
  "diff",
  "djangotemplate",
  "dockerfile",
  "dot",
  "doxygen",
  "doxygenlua",
  "dtd",
  "eiffel",
  "elixir",
  "elm",
  "email",
  "erlang",
  "fasm",
  "fortranfixed",
  "fortranfree",
  "fsharp",
  "gcc",
  "glsl",
  "gnuassembler",
  "go",
  "graphql",
  "groovy",
  "hamlet",
  "haskell",
  "haxe",
  "html",
  "idris",
  "ini",
  "isocpp",
  "j",
  "java",
  "javadoc",
  "javascript",
  "javascriptreact",
  "json",
  "jsp",
  "julia",
  "kotlin",
  "latex",
  "lex",
  "lilypond",
  "literatecurry",
  "literatehaskell",
  "llvm",
  "lua",
  "m4",
  "makefile",
  "mandoc",
  "markdown",
  "mathematica",
  "matlab",
  "maxima",
  "mediawiki",
  "metafont",
  "mips",
  "modelines",
  "modula2",
  "modula3",
  "monobasic",
  "mustache",
  "nasm",
  "nim",
  "noweb",
  "objectivec",
  "objectivecpp",
  "ocaml",
  "octave",
  "opencl",
  "pascal",
  "perl",
  "php",
  "pike",
  "postscript",
  "povray",
  "powershell",
  "prolog",
  "protobuf",
  "pure",
  "purebasic",
  "python",
  "qml",
  "r",
  "raku",
  "relaxng",
  "relaxngcompact",
  "rest",
  "rhtml",
  "roff",
  "ruby",
  "rust",
  "scala",
  "scheme",
  "sci",
  "sed",
  "sgml",
  "sml",
  "spdxcomments",
  "sql",
  "sqlmysql",
  "sqlpostgresql",
  "stata",
  "swift",
  "tcl",
  "tcsh",
  "texinfo",
  "toml",
  "typescript",
  "verilog",
  "vhdl",
  "xml",
  "xorg",
  "xslt",
  "xul",
  "yacc",
  "yaml",
  "zsh"
}

function isHighlightClass(class)
  for _, v in ipairs (kHighlightClasses) do
    if v == class then
      return true
    end
  end
  return false
end

-- callout.lua
-- Copyright (C) 2021 by RStudio, PBC

local calloutidx = 1

function callout() 
  return {
  
    -- Insert paragraphs between consecutive callouts or tables for docx
    Blocks = function(blocks)
      if _quarto.format.isDocxOutput() then
        local lastWasCallout = false
        local lastWasTableOrFigure = false
        local newBlocks = pandoc.List()
        for i,el in ipairs(blocks) do 
          -- determine what this block is
          local isCallout = el.t == "Div" and el.attr.classes:find_if(isDocxCallout)
          local isTableOrFigure = el.t == "Table" or isFigureDiv(el) or (discoverFigure(el, true) ~= nil)
          local isCodeBlock = el.t == "CodeBlock"

          -- Determine whether this is a code cell that outputs a table
          local isCodeCell = el.t == "Div" and el.attr.classes:find_if(isCodeCell)
          if isCodeCell and (isCodeCellTable(el) or isCodeCellFigure(el)) then 
            isTableOrFigure = true;
          end
          
          -- insert spacer if appropriate
          local insertSpacer = false
          if isCallout and (lastWasCallout or lastWasTableOrFigure) then
            insertSpacer = true
          end
          if isCodeBlock and lastWasCallout then
            insertSpacer = true
          end
          if isTableOrFigure and lastWasTableOrFigure then
            insertSpacer = true
          end

          if insertSpacer then
            newBlocks:insert(pandoc.Para(stringToInlines(" ")))
          end

          -- always insert
          newBlocks:insert(el)

          -- record last state
          lastWasCallout = isCallout
          lastWasTableOrFigure = isTableOrFigure

        end

        if #newBlocks > #blocks then
          return newBlocks
        else
          return nil
        end
      end
    end,

    -- Convert callout Divs into the appropriate element for this format
    Div = function(div)
      if div.attr.classes:find_if(isCallout) then
        preState.hasCallouts = true
        if _quarto.format.isHtmlOutput() and hasBootstrap() then
          return calloutDiv(div) 
        elseif _quarto.format.isLatexOutput() then
          return calloutLatex(div)
        elseif _quarto.format.isDocxOutput() then
          return calloutDocx(div)
        elseif _quarto.format.isEpubOutput() or _quarto.format.isRevealJsOutput() then
          return epubCallout(div)
        else
          return simpleCallout(div)
        end
      end  
    end
  }
end

function isCallout(class)
  return class == 'callout' or class:match("^callout%-")
end

function isDocxCallout(class)
  return class == "docx-callout"
end

function isCodeCell(class)
  return class == "cell"
end

function isCodeCellDisplay(class)
  return class == "cell-output-display"
end

-- Attempts to detect whether this element is a code cell
-- whose output is a table
function isCodeCellTable(el) 
  local isTable = false
  pandoc.walk_block(el, {
    Div = function(div) 
      if div.attr.classes:find_if(isCodeCellDisplay) then
        pandoc.walk_block(div, {
          Table = function(tbl)
            isTable = true
          end
        })
      end
    end
  })
  return isTable
end

function isCodeCellFigure(el)
  local isFigure = false
  pandoc.walk_block(el, {
    Div = function(div)
      if div.attr.classes:find_if(isCodeCellDisplay) then
        if (isFigureDiv(div)) then
          isFigure = true
        elseif div.content and #div.content > 0 then 
          isFigure = discoverFigure(div.content[1], true) ~= nil
        end
      end
    end
  })
  return isFigure
end

function calloutType(div)
  for _, class in ipairs(div.attr.classes) do
    if isCallout(class) then 
      local type = class:match("^callout%-(.*)")
      if type == nil then
        type = "none"
      end
      return type
    end
  end
  return nil
end

local kCalloutAppearanceDefault = "default"
local kCalloutDefaultSimple = "simple"
local kCalloutDefaultMinimal = "minimal"

-- an HTML callout div
function calloutDiv(div)

  -- the first heading is the caption
  local caption = resolveHeadingCaption(div)
  local type = calloutType(div)

  -- the callout type
  local processedCallout = processCalloutDiv(div)
  local calloutAppearance = processedCallout.appearance
  local icon = processedCallout.icon

  if calloutAppearance == kCalloutAppearanceDefault and caption == nil then
    caption = displayName(type)
  end

  local collapse = div.attr.attributes["collapse"]
  div.attr.attributes["collapse"] = nil

  -- Make an outer card div and transfer classes and id
  local calloutDiv = pandoc.Div({})
  calloutDiv.attr.identifier = div.attr.identifier
  calloutDiv.attr.classes = div.attr.classes:clone()
  div.attr.classes = pandoc.List() 
  div.attr.classes:insert("callout-body-container")

  -- add card attribute
  calloutDiv.attr.classes:insert("callout")
  calloutDiv.attr.classes:insert("callout-style-" .. calloutAppearance)

  -- the image placeholder
  local noicon = ""

  -- Check to see whether this is a recognized type
  if icon == false or not isBuiltInType(type) or type == nil then
    noicon = " no-icon"
    calloutDiv.attr.classes:insert("no-icon")
  end
  local imgPlaceholder = pandoc.Plain({pandoc.RawInline("html", "<i class='callout-icon" .. noicon .. "'></i>")});       
  local imgDiv = pandoc.Div({imgPlaceholder}, pandoc.Attr("", {"callout-icon-container"}));

  -- show a captioned callout
  if caption ~= nil then

    -- mark the callout as being captioned
    calloutDiv.attr.classes:insert("callout-captioned")

    -- create a unique id for the callout
    local calloutid = "callout-" .. calloutidx
    calloutidx = calloutidx + 1

    -- create the header to contain the caption
    -- caption should expand to fill its space
    local captionDiv = pandoc.Div(pandoc.Plain(caption), pandoc.Attr("", {"callout-caption-container", "flex-fill"}))
    local headerDiv = pandoc.Div({imgDiv, captionDiv}, pandoc.Attr("", {"callout-header", "d-flex", "align-content-center"}))
    local bodyDiv = div
    bodyDiv.attr.classes:insert("callout-body")

    if collapse ~= nil then 

      -- collapse default value     
      local expandedAttrVal= "true"
      if collapse == "true" then
        expandedAttrVal = "false"
      end

      -- create the collapse button
      local btnClasses = "callout-btn-toggle d-inline-block border-0 py-1 ps-1 pe-0 float-end"
      local btnIcon = "<i class='callout-toggle'></i>"
      local toggleButton = pandoc.RawInline("html", "<div class='" .. btnClasses .. "'>" .. btnIcon .. "</div>")
      headerDiv.content:insert(pandoc.Plain(toggleButton));

      -- configure the header div for collapse
      local bsTargetClz = calloutid .. "-contents"
      headerDiv.attr.attributes["bs-toggle"] = "collapse"
      headerDiv.attr.attributes["bs-target"] = "." .. bsTargetClz
      headerDiv.attr.attributes["aria-controls"] = calloutid
      headerDiv.attr.attributes["aria-expanded"] = expandedAttrVal
      headerDiv.attr.attributes["aria-label"] = 'Toggle callout'

      -- configure the body div for collapse
      local collapseDiv = pandoc.Div({})
      collapseDiv.attr.identifier = calloutid
      collapseDiv.attr.classes:insert(bsTargetClz)
      collapseDiv.attr.classes:insert("callout-collapse")
      collapseDiv.attr.classes:insert("collapse")
      if expandedAttrVal == "true" then
        collapseDiv.attr.classes:insert("show")
      end

      -- add the current body to the collapse div and use the collapse div instead
      collapseDiv.content:insert(bodyDiv)
      bodyDiv = collapseDiv
    end

    -- add the header and body to the div
    calloutDiv.content:insert(headerDiv)
    calloutDiv.content:insert(bodyDiv)

  else 
    -- show an uncaptioned callout
  
    -- create a card body
    local containerDiv = pandoc.Div({imgDiv, div}, pandoc.Attr("", {"callout-body"}))
    containerDiv.attr.classes:insert("d-flex")

    -- add the container to the callout card
    calloutDiv.content:insert(containerDiv)
  end
  
  return calloutDiv
end

-- Latex callout
function calloutLatex(div)
  
  -- read and clear attributes
  local caption = resolveHeadingCaption(div)
  local type = calloutType(div)

  local processedCallout = processCalloutDiv(div)
  local calloutAppearance = processedCallout.appearance
  local icon = processedCallout.icon

  div.attr.attributes["caption"] = nil
  div.attr.attributes["collapse"] = nil

  -- generate the callout box
  local callout
  if calloutAppearance == kCalloutAppearanceDefault then
    if caption == nil then
      caption = displayName(type)
    else
      caption = pandoc.write(pandoc.Pandoc(pandoc.Plain(caption)), 'latex')
    end
    callout = latexCalloutBoxDefault(caption, type, icon)
  else
    callout = latexCalloutBoxSimple(caption, type, icon)
  end
  local beginEnvironment = callout.beginInlines
  local endEnvironment = callout.endInlines
  local calloutContents = callout.contents
  if calloutContents == nil then
    calloutContents = pandoc.List({})
  end

  tappend(calloutContents, div.content)
  
  if calloutContents[1] ~= nil and calloutContents[1].t == "Para" and calloutContents[#calloutContents].t == "Para" then
    tprepend(calloutContents, { pandoc.Plain(beginEnvironment) })
    tappend(calloutContents, { pandoc.Plain(endEnvironment) })
  else
    tprepend(calloutContents, { pandoc.Para(beginEnvironment) })
    tappend(calloutContents, { pandoc.Para(endEnvironment) })
  end


  return pandoc.Div(calloutContents)
end

function latexCalloutBoxDefault(caption, type, icon) 

  -- callout dimensions
  local leftBorderWidth = '.75mm'
  local borderWidth = '.15mm'
  local borderRadius = '.35mm'
  local leftPad = '2mm'
  local color = latexColorForType(type)
  local frameColor = latexFrameColorForType(type)

  local iconForType = iconForType(type)

  -- generate options
  local options = {
    breakable = "",
    colframe = frameColor,
    colbacktitle = color ..'!10!white',
    coltitle = 'black',
    colback = 'white',
    opacityback = 0,
    opacitybacktitle =  0.6,
    left = leftPad,
    leftrule = leftBorderWidth,
    toprule = borderWidth, 
    bottomrule = borderWidth,
    rightrule = borderWidth,
    arc = borderRadius,
    title = '{' .. caption .. '}',
    titlerule = '0mm',
    toptitle = '1mm',
    bottomtitle = '1mm',
  }

  if icon ~= false and iconForType ~= nil then
    options.title = '\\textcolor{' .. color .. '}{\\' .. iconForType .. '}\\hspace{0.5em}' ..  options.title
  end

  -- the core latex for the box
  local beginInlines = { pandoc.RawInline('latex', '\\begin{tcolorbox}[enhanced jigsaw, ' .. tColorOptions(options) .. ']\n') }
  local endInlines = { pandoc.RawInline('latex', '\n\\end{tcolorbox}') }

  -- Add the captions and contents
  local calloutContents = pandoc.List({});

  -- the inlines
  return { 
    contents = calloutContents,
    beginInlines = beginInlines, 
    endInlines = endInlines
  }

end

-- create the tcolorBox
function latexCalloutBoxSimple(caption, type, icon)

  -- callout dimensions
  local leftBorderWidth = '.75mm'
  local borderWidth = '.15mm'
  local borderRadius = '.35mm'
  local leftPad = '2mm'
  local color = latexColorForType(type)
  local colorFrame = latexFrameColorForType(type)

  -- generate options
  local options = {
    breakable = "",
    colframe = colorFrame,
    colback = 'white',
    opacityback = 0,
    left = leftPad,
    leftrule = leftBorderWidth,
    toprule = borderWidth, 
    bottomrule = borderWidth,
    rightrule = borderWidth,
    arc = borderRadius,
  }

  -- the core latex for the box
  local beginInlines = { pandoc.RawInline('latex', '\\begin{tcolorbox}[enhanced jigsaw, ' .. tColorOptions(options) .. ']\n') }
  local endInlines = { pandoc.RawInline('latex', '\n\\end{tcolorbox}') }

  -- generate the icon and use a minipage to position it
  local iconForCat = iconForType(type)
  if icon ~= false and iconForCat ~= nil then
    local iconName = '\\' .. iconForCat
    local iconColSize = '5.5mm'

    -- add an icon to the begin
    local iconTex = '\\begin{minipage}[t]{' .. iconColSize .. '}\n\\textcolor{' .. color .. '}{' .. iconName .. '}\n\\end{minipage}%\n\\begin{minipage}[t]{\\textwidth - ' .. iconColSize .. '}\n'
    tappend(beginInlines, {pandoc.RawInline('latex',  iconTex)})

    -- close the icon
    tprepend(endInlines, {pandoc.RawInline('latex', '\\end{minipage}%')});
  end

  -- Add the captions and contents
  local calloutContents = pandoc.List({});
  if caption ~= nil then 
    tprepend(caption, {pandoc.RawInline('latex', '\\textbf{')})
    tappend(caption, {pandoc.RawInline('latex', '}\\vspace{2mm}')})
    calloutContents:insert(pandoc.Para(caption))
  end

  -- the inlines
  return { 
    contents = calloutContents,
    beginInlines = beginInlines, 
    endInlines = endInlines
  }
end

function processCalloutDiv(div) 

  local type = calloutType(div)
  local iconDefault = true
  local appearanceDefault = nil
  if type == "none" then
    iconDefault = false
    appearanceDefault = "simple"
  end

  local icon = div.attr.attributes["icon"]
  div.attr.attributes["icon"] = nil
  if icon == nil then
    icon = option("callout-icon", iconDefault)
  elseif icon == "false" then
    icon = false
  end
  

  local appearanceRaw = div.attr.attributes["appearance"]
  div.attr.attributes["appearance"] = nil
  if appearanceRaw == nil then
    appearanceRaw = option("callout-appearance", appearanceDefault)
  end
  
  local appearance = nameForCalloutStyle(appearanceRaw);
  if appearance == "minimal" then
    icon = false
    appearance = "simple"
  end

  return { icon = icon, appearance = appearance}

end

function calloutDocx(div)
  local type = calloutType(div)
  local processedCallout = processCalloutDiv(div)
  local appearance = processedCallout.appearance
  local hasIcon = processedCallout.icon 

  if appearance == kCalloutAppearanceDefault then
    return calloutDocxDefault(div, type, hasIcon)
  else
    return calloutDocxSimple(div, type, hasIcon)
  end
end


function calloutDocxDefault(div, type, hasIcon)

  local caption = resolveHeadingCaption(div)  
  local color = htmlColorForType(type)
  local backgroundColor = htmlBackgroundColorForType(type)

  local tablePrefix = [[
    <w:tbl>
    <w:tblPr>
      <w:tblStyle w:val="Table" />
      <w:tblLook w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0" w:val="0000" />
      <w:tblBorders>  
        <w:left w:val="single" w:sz="24" w:space="0" w:color="$color"/>  
        <w:right w:val="single" w:sz="4" w:space="0" w:color="$color"/>  
        <w:top w:val="single" w:sz="4" w:space="0" w:color="$color"/>  
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="$color"/>  
      </w:tblBorders> 
      <w:tblCellMar>
        <w:left w:w="144" w:type="dxa" />
        <w:right w:w="144" w:type="dxa" />
      </w:tblCellMar>
      <w:tblInd w:w="164" w:type="dxa" />
      <w:tblW w:type="pct" w:w="100%"/>
    </w:tblPr>
    <w:tr>
      <w:trPr>
        <w:cantSplit/>
      </w:trPr>
      <w:tc>
        <w:tcPr>
          <w:shd w:color="auto" w:fill="$background" w:val="clear"/>
          <w:tcMar>
            <w:top w:w="92" w:type="dxa" />
            <w:bottom w:w="92" w:type="dxa" />
          </w:tcMar>
        </w:tcPr>
  ]]
  local calloutContents = pandoc.List({
    pandoc.RawBlock("openxml", tablePrefix:gsub('$background', backgroundColor):gsub('$color', color)),
  })

  -- Create a caption if there isn't already one
  if caption == nil then
    caption = pandoc.List({pandoc.Str(displayName(type))})
  end

  -- add the image to the caption, if needed
  local calloutImage = docxCalloutImage(type);
  if hasIcon and calloutImage ~= nil then
    -- Create a paragraph with the icon, spaces, and text
    local imageCaption = pandoc.List({
        pandoc.RawInline("openxml", '<w:pPr>\n<w:spacing w:before="0" w:after="0" />\n<w:textAlignment w:val="center"/>\n</w:pPr>'), 
        calloutImage,
        pandoc.Space(), 
        pandoc.Space()})
    tappend(imageCaption, caption)
    calloutContents:insert(pandoc.Para(imageCaption))
  else
    local captionRaw = openXmlPara(pandoc.Para(caption), 'w:before="16" w:after="16"')
    calloutContents:insert(captionRaw)  
  end

  
  -- end the caption row and start the body row
  local tableMiddle = [[
      </w:tc>
    </w:tr>
    <w:tr>
      <w:trPr>
        <w:cantSplit/>
      </w:trPr>
      <w:tc> 
      <w:tcPr>
        <w:tcMar>
          <w:top w:w="108" w:type="dxa" />
          <w:bottom w:w="108" w:type="dxa" />
        </w:tcMar>
      </w:tcPr>

  ]]
  calloutContents:insert(pandoc.Div(pandoc.RawBlock("openxml", tableMiddle)))  

  -- the main contents of the callout
  local contents = div.content

  -- ensure there are no nested callouts
  if contents:find_if(function(el) 
    return el.t == "Div" and el.attr.classes:find_if(isDocxCallout) ~= nil 
  end) ~= nil then
    fail("Found a nested callout in the document. Please fix this issue and try again.")
  end
  
  -- remove padding from existing content and add it
  removeParagraphPadding(contents)
  tappend(calloutContents, contents)

  -- close the table
  local suffix = pandoc.List({pandoc.RawBlock("openxml", [[
    </w:tc>
    </w:tr>
  </w:tbl>
  ]])})
  tappend(calloutContents, suffix)

  -- return the callout
  local callout = pandoc.Div(calloutContents, pandoc.Attr("", {"docx-callout"}))
  return callout
end


function calloutDocxSimple(div, type, hasIcon) 

  local color = htmlColorForType(type)
  local caption = resolveHeadingCaption(div)  

  local tablePrefix = [[
    <w:tbl>
    <w:tblPr>
      <w:tblStyle w:val="Table" />
      <w:tblLook w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0" w:val="0000" />
      <w:tblBorders>  
        <w:left w:val="single" w:sz="24" w:space="0" w:color="$color"/>  
      </w:tblBorders> 
      <w:tblCellMar>
        <w:left w:w="0" w:type="dxa" />
        <w:right w:w="0" w:type="dxa" />
      </w:tblCellMar>
      <w:tblInd w:w="164" w:type="dxa" />
    </w:tblPr>
    <w:tr>
      <w:trPr>
        <w:cantSplit/>
      </w:trPr>
      <w:tc>
  ]]

  local prefix = pandoc.List({
    pandoc.RawBlock("openxml", tablePrefix:gsub('$color', color)),
  })

  local calloutImage = docxCalloutImage(type)
  if hasIcon and calloutImage ~= nil then
    local imagePara = pandoc.Para({
      pandoc.RawInline("openxml", '<w:pPr>\n<w:spacing w:before="0" w:after="8" />\n<w:jc w:val="center" />\n</w:pPr>'), calloutImage})
    prefix:insert(pandoc.RawBlock("openxml", '<w:tcPr><w:tcMar><w:left w:w="144" w:type="dxa" /><w:right w:w="144" w:type="dxa" /></w:tcMar></w:tcPr>'))
    prefix:insert(imagePara)
    prefix:insert(pandoc.RawBlock("openxml",  "</w:tc>\n<w:tc>"))
  else     
    prefix:insert(pandoc.RawBlock("openxml", '<w:tcPr><w:tcMar><w:left w:w="144" w:type="dxa" /></w:tcMar></w:tcPr>'))
  end

  local suffix = pandoc.List({pandoc.RawBlock("openxml", [[
    </w:tc>
    </w:tr>
  </w:tbl>
  ]])})

  local calloutContents = pandoc.List({});
  tappend(calloutContents, prefix)

  -- deal with the caption, if present
  if caption ~= nil then
    local captionPara = pandoc.Para(pandoc.Strong(caption))
    calloutContents:insert(openXmlPara(captionPara, 'w:before="16" w:after="64"'))
  end
  
  -- convert to open xml paragraph
  local contents = div.content;
  removeParagraphPadding(contents)
  
  -- ensure there are no nested callouts
  if contents:find_if(function(el) 
    return el.t == "Div" and el.attr.classes:find_if(isDocxCallout) ~= nil 
  end) ~= nil then
    fail("Found a nested callout in the document. Please fix this issue and try again.")
  end

  tappend(calloutContents, contents)
  tappend(calloutContents, suffix)

  local callout = pandoc.Div(calloutContents, pandoc.Attr("", {"docx-callout"}))
  return callout
end

function epubCallout(div)
  -- read the caption and type info
  local caption = resolveHeadingCaption(div)
  local type = calloutType(div)
  
  -- the callout type
  local processedCallout = processCalloutDiv(div)
  local calloutAppearance = processedCallout.appearance
  local hasIcon = processedCallout.icon

  if calloutAppearance == kCalloutAppearanceDefault and caption == nil then
    caption = displayName(type)
  end
  
  -- the body of the callout
  local calloutBody = pandoc.Div({}, pandoc.Attr("", {"callout-body"}))

  local imgPlaceholder = pandoc.Plain({pandoc.RawInline("html", "<i class='callout-icon'></i>")});       
  local imgDiv = pandoc.Div({imgPlaceholder}, pandoc.Attr("", {"callout-icon-container"}));

  -- caption
  if caption ~= nil then
    local calloutCaption = pandoc.Div({}, pandoc.Attr("", {"callout-caption"}))
    if hasIcon then
      calloutCaption.content:insert(imgDiv)
    end
    calloutCaption.content:insert(pandoc.Para(pandoc.Strong(caption)))
    calloutBody.content:insert(calloutCaption)
  else 
    if hasIcon then
      calloutBody.content:insert(imgDiv)
    end
  end

  -- contents 
  local calloutContents = pandoc.Div(div.content, pandoc.Attr("", {"callout-content"}))
  calloutBody.content:insert(calloutContents)

  -- set attributes (including hiding icon)
  local attributes = pandoc.List({"callout"})
  if type ~= nil then
    attributes:insert("callout-" .. type)
  end

  if hasIcon == false then
    attributes:insert("no-icon")
  end
  if caption ~= nil then
    attributes:insert("callout-captioned")
  end
  attributes:insert("callout-style-" .. calloutAppearance)

  return pandoc.Div({calloutBody}, pandoc.Attr(div.attr.identifier, attributes))
end

function simpleCallout(div) 
  local icon, type, contents = resolveCalloutContents(div, true)
  local callout = pandoc.BlockQuote(contents)
  return pandoc.Div(callout, pandoc.Attr(div.attr.identifier))
end

function resolveCalloutContents(div, requireCaption)
  local caption = resolveHeadingCaption(div)
  local type = calloutType(div)
  local icon = div.attr.attributes["icon"]
  
  div.attr.attributes["caption"] = nil
  div.attr.attributes["icon"] = nil
  div.attr.attributes["collapse"] = nil

  local contents = pandoc.List({});
    
  -- Add the captions and contents
  -- classname 
  if caption == nil and requireCaption then 
---@diagnostic disable-next-line: need-check-nil
    caption = stringToInlines(type:sub(1,1):upper()..type:sub(2))
  end
  
  -- raw paragraph with styles (left border, colored)
  if caption ~= nil then
    contents:insert(pandoc.Para(pandoc.Strong(caption)))
  end
  tappend(contents, div.content)

  return icon, type, contents
end

function removeParagraphPadding(contents) 
  if #contents > 0 then

    if #contents == 1 then
      if contents[1].t == "Para" then
        contents[1] = openXmlPara(contents[1], 'w:before="16" w:after="16"')
      end  
    else
      if contents[1].t == "Para" then 
        contents[1] = openXmlPara(contents[1], 'w:before="16"')
      end

      if contents[#contents].t == "Para" then 
        contents[#contents] = openXmlPara(contents[#contents], 'w:after="16"')
      end
    end
  end
end

function openXmlPara(para, spacing) 
  local xmlPara = pandoc.Para({
    pandoc.RawInline("openxml", "<w:pPr>\n<w:spacing " .. spacing .. "/>\n</w:pPr>")
  })
  tappend(xmlPara.content, para.content)
  return xmlPara
end

function nameForCalloutStyle(calloutType) 
  if calloutType == nil then
    return "default"
  else 
    local name = pandoc.utils.stringify(calloutType);

    if name:lower() == "minimal" then
      return "minimal"
    elseif name:lower() == "simple" then
      return "simple"
    else
      return "default"
    end
  end
end

local kDefaultDpi = 96
function docxCalloutImage(type)

  -- If the DPI has been changed, we need to scale the callout icon
  local dpi = pandoc.WriterOptions(PANDOC_WRITER_OPTIONS)['dpi']
  local scaleFactor = 1
  if dpi ~= nil then
    scaleFactor = dpi / kDefaultDpi
  end

  -- try to form the svg name
  local svg = nil
  if type ~= nil then
    svg = param("icon-" .. type, nil)
  end

  -- lookup the image
  if svg ~= nil then
    local img = pandoc.Image({}, svg, '', {[kProjectResolverIgnore]="true"})
    img.attr.attributes["width"] = tostring(16 * scaleFactor)
    img.attr.attributes["height"] = tostring(16 * scaleFactor)
    return img
  else
    return nil
  end
end

function htmlColorForType(type) 
  if type == 'note' then
    return kColorNote
  elseif type == "warning" then
    return kColorWarning
  elseif type == "important" then
    return kColorImportant
  elseif type == "caution" then
    return kColorCaution
  elseif type == "tip" then 
    return kColorTip
  else
    return kColorUnknown
  end
end

function htmlBackgroundColorForType(type)
  if type == 'note' then
    return kBackgroundColorNote
  elseif type == "warning" then
    return kBackgroundColorWarning
  elseif type == "important" then
    return kBackgroundColorImportant
  elseif type == "caution" then
    return kBackgroundColorCaution
  elseif type == "tip" then 
    return kBackgroundColorTip
  else
    return kColorUnknown
  end
end

function latexColorForType(type) 
  if type == 'note' then
    return "quarto-callout-note-color"
  elseif type == "warning" then
    return "quarto-callout-warning-color"
  elseif type == "important" then
    return "quarto-callout-important-color"
  elseif type == "caution" then
    return "quarto-callout-caution-color"
  elseif type == "tip" then 
    return "quarto-callout-tip-color"
  else
    return "quarto-callout-color"
  end
end

function latexFrameColorForType(type) 
  if type == 'note' then
    return "quarto-callout-note-color-frame"
  elseif type == "warning" then
    return "quarto-callout-warning-color-frame"
  elseif type == "important" then
    return "quarto-callout-important-color-frame"
  elseif type == "caution" then
    return "quarto-callout-caution-color-frame"
  elseif type == "tip" then 
    return "quarto-callout-tip-color-frame"
  else
    return "quarto-callout-color-frame"
  end
end


function iconForType(type) 
  if type == 'note' then
    return "faInfo"
  elseif type == "warning" then
    return "faExclamationTriangle"
  elseif type == "important" then
    return "faExclamation"
  elseif type == "caution" then
    return "faFire"
  elseif type == "tip" then 
    return "faLightbulb"
  else
    return nil
  end
end

function isBuiltInType(type) 
  local icon = iconForType(type)
  return icon ~= nil
end

function displayName(type)
  local defaultName = type:sub(1,1):upper()..type:sub(2)
  return param("callout-" .. type .. "-caption", defaultName)
end

-- meta.lua
-- Copyright (C) 2020 by RStudio, PBC

-- inject metadata
function quartoPreMetaInject()
  return {
    Meta = function(meta)

      -- injection awesomebox for captions, if needed
      if preState.hasCallouts and _quarto.format.isLatexOutput() then
        metaInjectLatex(meta, function(inject)
          inject(
            usePackageWithOption("tcolorbox", "many")
          )
          inject(
            usePackage("fontawesome5")
          )
          inject(
            "\\definecolor{quarto-callout-color}{HTML}{" .. kColorUnknown .. "}\n" ..
            "\\definecolor{quarto-callout-note-color}{HTML}{" .. kColorNote .. "}\n" ..
            "\\definecolor{quarto-callout-important-color}{HTML}{" .. kColorImportant .. "}\n" ..
            "\\definecolor{quarto-callout-warning-color}{HTML}{" .. kColorWarning .."}\n" ..
            "\\definecolor{quarto-callout-tip-color}{HTML}{" .. kColorTip .."}\n" ..
            "\\definecolor{quarto-callout-caution-color}{HTML}{" .. kColorCaution .. "}\n" ..
            "\\definecolor{quarto-callout-color-frame}{HTML}{" .. kColorUnknownFrame .. "}\n" ..
            "\\definecolor{quarto-callout-note-color-frame}{HTML}{" .. kColorNoteFrame .. "}\n" ..
            "\\definecolor{quarto-callout-important-color-frame}{HTML}{" .. kColorImportantFrame .. "}\n" ..
            "\\definecolor{quarto-callout-warning-color-frame}{HTML}{" .. kColorWarningFrame .."}\n" ..
            "\\definecolor{quarto-callout-tip-color-frame}{HTML}{" .. kColorTipFrame .."}\n" ..
            "\\definecolor{quarto-callout-caution-color-frame}{HTML}{" .. kColorCautionFrame .. "}\n"
          )
        end)
      end

      metaInjectLatex(meta, function(inject)
        if preState.usingTikz then
          inject(usePackage("tikz"))
        end
      end)


      metaInjectLatex(meta, function(inject)
        if preState.usingBookmark then
          inject(
            usePackage("bookmark")
          )    
        end
      end)

      return meta
    end
  }
end


-- book-links.lua
-- Copyright (C) 2020 by RStudio, PBC

function indexBookFileTargets() 
    if not param("single-file-book", false) then
      return {} 
    else 
      return {
        Header = function(el)
        if el.level == 1 then 
          local file = currentFileMetadataState().file
          if file ~= nil then   
            local filename = file.bookItemFile;
            if filename ~= nil and preState.fileSectionIds[filename] == nil then
              preState.fileSectionIds[filename] = el.identifier
            end
          end
        end
      end
    }
  end
end

function resolveBookFileTargets() 
  if not param("single-file-book", false) then
    return {} 
  else
    return {
      Link = function(el)
        local linkTarget = el.target
        -- if this is a local path
        if isRelativeRef(linkTarget) then
          local file = currentFileMetadataState().file
  
          -- normalize the linkTarget (collapsing any '..')
          if #linkTarget > 0 then
            local fullPath = linkTarget
            if file ~= nil and file.resourceDir ~= nil then
              fullPath = pandoc.path.join({file.resourceDir, linkTarget})
            end
            linkTarget = pandoc.path.normalize(flatten(fullPath));
          end
          
          -- resolve the path
          local hashPos = string.find(linkTarget, '#')
          if hashPos ~= nil then
            -- deal with a link that includes a hash (just remove the prefix)
            local target = string.sub(linkTarget, hashPos, #linkTarget)
            el.target = target
          else
            -- Deal with bare file links
            -- escape windows paths if present
            package.config:sub(1,1)
            
            -- Paths are always using '/' separator (even on windows)
            linkTarget = linkTarget:gsub("\\", "/")
            local sectionId = preState.fileSectionIds[linkTarget];
            if sectionId ~= nil then
              el.target = '#' .. sectionId
            end
          end
        end
        return el
      end 
    }  
  end
end

function flatten(targetPath) 
  local pathParts = pandoc.path.split(targetPath)
  local resolvedPath = pandoc.List()

  for _, part in ipairs(pathParts) do 
    if part == '..' then
      table.remove(resolvedPath)
    else
      resolvedPath:insert(part)
    end
  end
  return pandoc.path.join(resolvedPath)
end

-- book-numbering.lua
-- Copyright (C) 2020 by RStudio, PBC

function bookNumbering() 
  return {
    Header = function(el)
      local file = currentFileMetadataState().file
      if file ~= nil then
        local bookItemType = file.bookItemType
        local bookItemDepth = file.bookItemDepth
        if bookItemType ~= nil then
          -- if we are in an unnumbered chapter then add unnumbered class
          if bookItemType == "chapter" and file.bookItemNumber == nil then
            el.attr.classes:insert('unnumbered')
          end

          -- handle latex "part" and "appendix" headers
          if el.level == 1 and _quarto.format.isLatexOutput() then
            if bookItemType == "part" then
              local partPara = pandoc.Para({
                pandoc.RawInline('latex', '\\part{')
              })
              tappend(partPara.content, el.content)
              partPara.content:insert( pandoc.RawInline('latex', '}'))
              return partPara  
            elseif bookItemType == "appendix" then
              local appendixPara = pandoc.Para({
                pandoc.RawInline('latex', '\\appendix\n\\addcontentsline{toc}{part}{')
              })
              tappend(appendixPara.content, el.content)
              appendixPara.content:insert(pandoc.RawInline('latex', '}'))
              return appendixPara
            elseif bookItemType == "chapter" and bookItemDepth == 0 then
              preState.usingBookmark = true
              local bookmarkReset = pandoc.Div({
                pandoc.RawInline('latex', '\\bookmarksetup{startatroot}\n'),
                el
              })
              return bookmarkReset
            end
          end

          -- mark appendix chapters for epub
          if el.level == 1 and _quarto.format.isEpubOutput() then
            if file.appendix == true and bookItemType == "chapter" then
              el.attr.attributes["epub:type"] = "appendix"
            end
          end

          -- part cover pages have unnumbered headings
          if (bookItemType == "part") then
            el.attr.classes:insert("unnumbered")
          end

          -- return potentially modified heading el
          return el
        end
      end
    end
  }
end

-- bibliography-formats.lua
-- Copyright (C) 2020 by RStudio, PBC


function bibliographyFormats()
  return  {
    Pandoc = function(doc)
      if _quarto.format.isBibliographyOutput() then
        doc.meta.references = pandoc.utils.references(doc)
        doc.meta.bibliography = nil
        return doc
      end
    end
  }
end

-- resourcefiles.lua
-- Copyright (C) 2020 by RStudio, PBC

function resourceFiles() 
  return {
    -- TODO: discover resource files
    -- Note that currently even if we discover resourceFiles in markdown they don't 
    -- actually register for site preview b/c we don't actually re-render html
    -- files for preview if they are newer than the source files. we may need to
    -- record discovered resource files in some sort of index in order to work 
    -- around this
  }
end

-- function to record a file resource
function recordFileResource(res)
  preState.results.resourceFiles:insert(res)
end



-- theorems.lua
-- Copyright (C) 2021 by RStudio, PBC


function theorems() 
  
  return {
    Div = function(el)
      if hasTheoremRef(el) then
        local capEl = el.content[1]
        if capEl ~= nil and capEl.t == 'Header' then
          capEl.attr.classes:insert("unnumbered")
          capEl.attr.classes:insert("unlisted")
        end
      end
      return el
    end,
  }
end

-- table-colwidth.lua
-- Copyright (C) 2020 by RStudio, PBC

local kTblColwidths = "tbl-colwidths"

local function noWidths(ncol)
  local widths = {}
  for i = 1,ncol do
    widths[i] = 0
  end
  return widths
end

-- takes a tblColwidths attribute value (including nil) and returns an table
-- of pandoc AST colwidths 
local function tblColwidthValues(tbl, tblColwidths)
  -- determine the widths (using any passed param as the default)
  if tblColwidths == nil then
    tblColwidths = param(kTblColwidths, true)
  elseif tblColwidths == "true" then
    tblColwidths = true
  elseif tblColwidths == "false" then
    tblColwidths = false
  end

  -- take appropriate action
  if tblColwidths == "auto" then
    local foundLink = false
    pandoc.walk_block(tbl, {
      Link = function(el)
        foundLink = true
      end
    })
    if foundLink then
      return noWidths(#tbl.colspecs)
    else
      return nil
    end
  elseif tblColwidths == true then
    return nil
  elseif tblColwidths == false then
    return noWidths(#tbl.colspecs)
  else
    if type(tblColwidths) == "string" then
      -- provide array brackets if necessary
      if tblColwidths:find("[", 1, true) ~= 1 then
        tblColwidths = '[' .. tblColwidths .. ']'
      end
      -- decode array
      tblColwidths = quarto.json.decode(tblColwidths)
    end
    if type(tblColwidths) == "table" then
      local totalWidth = 0
      local widths = {}
      for i = 1,#tbl.colspecs do
        if i <= #tblColwidths then
          widths[i] = tblColwidths[i]
        else
          widths[i] = tblColwidths[#tblColwidths]
        end
        totalWidth = totalWidth + widths[i]
      end

      -- normalize to 100 if the total is > 100
      if totalWidth > 100 then
        for i=1,#widths do 
          widths[i] = round((widths[i]/totalWidth) * 100, 1)
        end
      end

      -- convert all widths to decimal
      for i=1,#widths do 
        widths[i] = round(widths[i] / 100, 2)
      end

      return widths
    else
      warn("Unexpected tbl-colwidths value: " .. tblColwidths)
      return nil
    end
  end
end

-- propagate cell level tbl-colwidths to tables
function tableColwidthCell() 
  return {
    Div = function(el)
      if tcontains(el.attr.classes, "cell") then
        local tblColwidths = el.attr.attributes[kTblColwidths]
        el.attr.attributes[kTblColwidths] = nil
        if tblColwidths ~= nil then
          return pandoc.walk_block(el, {
            Table = function(tbl)
              tbl.attr.attributes[kTblColwidths] = tblColwidths
              return tbl
            end
          })
        end
      end
    end,
  }
end

-- handle tbl-colwidth
function tableColwidth()

  return {
   
    Table = function(tbl)
     
      -- see if we have a tbl-colwidths attribute
      local tblColwidths = nil
      if tbl.caption.long ~= nil and #tbl.caption.long > 0 then
        local caption =  tbl.caption.long[#tbl.caption.long]
        
        local tblCaption, attr = parseTableCaption(pandoc.utils.blocks_to_inlines({caption}))
        tblColwidths = attr.attributes[kTblColwidths]
        if tblColwidths ~= nil then
          attr.attributes[kTblColwidths] = nil
          tbl.caption.long[#tbl.caption.long] = pandoc.Plain(createTableCaption(tblCaption, attr))
        end
      end

      -- failing that check for an ambient attribute provided by a cell
      if tblColwidths == nil then
        tblColwidths = tbl.attr.attributes[kTblColwidths]
      end
      tbl.attr.attributes[kTblColwidths] = nil
  
      -- realize values and apply them
      local colwidthValues = tblColwidthValues(tbl, tblColwidths)
      if colwidthValues ~= nil then
        local simpleTbl = pandoc.utils.to_simple_table(tbl)
        simpleTbl.widths = colwidthValues
        return pandoc.utils.from_simple_table(simpleTbl)
      end
    end
  }

end


-- table-captions.lua
-- Copyright (C) 2020 by RStudio, PBC

kTblCap = "tbl-cap"
kTblSubCap = "tbl-subcap"

local latexCaptionPattern =  "(\\caption{)(.-)(}[^\n]*\n)"

function tableCaptions() 
  
  return {
   
    Div = function(el)
      if tcontains(el.attr.classes, "cell") then
        -- extract table attributes
        local tblCap = extractTblCapAttrib(el,kTblCap)
        local tblSubCap = extractTblCapAttrib(el, kTblSubCap, true)
        if hasTableRef(el) or tblCap then
          local tables = countTables(el)
          if tables > 0 then
           
            -- apply captions and labels if we have a tbl-cap or tbl-subcap
            if tblCap or tblSubCap then
  
              -- special case: knitr::kable will generate a \begin{tablular} without
              -- a \begin{table} wrapper -- put the wrapper in here if need be
              if _quarto.format.isLatexOutput() then
                el = pandoc.walk_block(el, {
                  RawBlock = function(raw)
                    if _quarto.format.isRawLatex(raw) then
                      if raw.text:match(_quarto.patterns.latexTabularPattern) and not raw.text:match(_quarto.patterns.latexTablePattern) then
                        raw.text = raw.text:gsub(_quarto.patterns.latexTabularPattern, 
                                                "\\begin{table}\n\\centering\n%1%2%3\n\\end{table}\n",
                                                1)
                        return raw                       
                      end
                    end
                  end
                })
              end
  
              -- compute all captions and labels
              local label = el.attr.identifier
              local mainCaption, tblCaptions, mainLabel, tblLabels = tableCaptionsAndLabels(
                label,
                tables,
                tblCap,
                tblSubCap
              )              
              -- apply captions and label
              el.attr.identifier = mainLabel
              if mainCaption then
                el.content:insert(pandoc.Para(mainCaption))
              end
              if #tblCaptions > 0 then
                el = applyTableCaptions(el, tblCaptions, tblLabels)
              end
              return el
            end
          end
        end
      end
      
      
    end
  }

end

function tableCaptionsAndLabels(label, tables, tblCap, tblSubCap)
  
  local mainCaption = nil
  local tblCaptions = pandoc.List()
  local mainLabel = ""
  local tblLabels = pandoc.List()

  -- case: no subcaps (no main caption or label, apply caption(s) to tables)
  if not tblSubCap then
    -- case: single table (no label interpolation)
    if tables == 1 then
      tblCaptions:insert(markdownToInlines(tblCap[1]))
      tblLabels:insert(label)
    -- case: single caption (apply to entire panel)
    elseif #tblCap == 1 then
      mainCaption = tblCap[1]
      mainLabel = label
    -- case: multiple tables (label interpolation)
    else
      for i=1,tables do
        if i <= #tblCap then
          tblCaptions:insert(markdownToInlines(tblCap[i]))
          if #label > 0 then
            tblLabels:insert(label .. "-" .. tostring(i))
          else
            tblLabels:insert("")
          end
        end
      end
    end
  
  -- case: subcaps
  else
    mainLabel = label
    if mainLabel == "" then
      mainLabel = anonymousTblId()
    end
    if tblCap then
      mainCaption = markdownToInlines(tblCap[1])
    else
      mainCaption = noCaption()
    end
    for i=1,tables do
      if tblSubCap and i <= #tblSubCap and tblSubCap[i] ~= "" then
        tblCaptions:insert(markdownToInlines(tblSubCap[i]))
      else
        tblCaptions:insert(pandoc.List())
      end
      if #mainLabel > 0 then
        tblLabels:insert(mainLabel .. "-" .. tostring(i))
      else
        tblLabels:insert("")
      end
    end
  end

  return mainCaption, tblCaptions, mainLabel, tblLabels

end

function applyTableCaptions(el, tblCaptions, tblLabels)
  local idx = 1
  return pandoc.walk_block(el, {
    Table = function(el)
      if idx <= #tblLabels then
        local table = pandoc.utils.to_simple_table(el)
        if #tblCaptions[idx] > 0 then
          table.caption = pandoc.List()
          tappend(table.caption, tblCaptions[idx])
          table.caption:insert(pandoc.Space())
        end
        if table.caption == nil then
          table.caption = pandoc.List()
        end
        if #tblLabels[idx] > 0 then
          tappend(table.caption, {
            pandoc.Str("{#" .. tblLabels[idx] .. "}")
          })
        end
        idx = idx + 1
        return pandoc.utils.from_simple_table(table)
      end
    end,
    RawBlock = function(raw)
      if idx <= #tblLabels then
        -- (1) if there is no caption at all then populate it from tblCaptions[idx]
        -- (assuming there is one, might not be in case of empty subcaps)
        -- (2) Append the tblLabels[idx] to whatever caption is there
        if hasRawHtmlTable(raw) then
          -- html table patterns
          local tablePattern = htmlTablePattern()
          local captionPattern = htmlTableCaptionPattern()
          -- insert caption if there is none
          local beginCaption, caption = raw.text:match(captionPattern)
          if not beginCaption then
            raw.text = raw.text:gsub(tablePattern, "%1" .. "<caption></caption>" .. "%2%3", 1)
          end
          -- apply table caption and label
          local beginCaption, captionText, endCaption = raw.text:match(captionPattern)
          if #tblCaptions[idx] > 0 then
            captionText = pandoc.utils.stringify(tblCaptions[idx])
          end
          if #tblLabels[idx] > 0 then
            captionText = captionText .. " {#" .. tblLabels[idx] .. "}"
          end
          raw.text = raw.text:gsub(captionPattern, "%1" .. captionText:gsub("%%", "%%%%") .. "%3", 1)
        elseif hasRawLatexTable(raw) then
          for i,pattern in ipairs(_quarto.patterns.latexTablePatterns) do
            if raw.text:match(pattern) then
              raw.text = applyLatexTableCaption(raw.text, tblCaptions[idx], tblLabels[idx], pattern)
              break
            end
          end
        elseif hasPagedHtmlTable(raw) then
          if #tblCaptions[idx] > 0 then
            local captionText = pandoc.utils.stringify(tblCaptions[idx])
            if #tblLabels[idx] > 0 then
              captionText = captionText .. " {#" .. tblLabels[idx] .. "}"
            end
            local pattern = "(<div data[-]pagedtable=\"false\">)"
            -- we don't have a table to insert a caption to, so we'll wrap the caption with a div and the right class instead
            local replacement = "%1 <div class=\"table-caption\"><caption>" .. captionText:gsub("%%", "%%%%") .. "</caption></div>"
            raw.text = raw.text:gsub(pattern, replacement)
          end
        end
       
        idx = idx + 1
        return raw
      end
    end
  })
end


function applyLatexTableCaption(latex, tblCaption, tblLabel, tablePattern)
  -- insert caption if there is none
  local beginCaption, caption = latex:match(latexCaptionPattern)
  if not beginCaption then
    latex = latex:gsub(tablePattern, "%1" .. "\n\\caption{ }\\tabularnewline\n" .. "%2%3", 1)
  end
  -- apply table caption and label
  local beginCaption, captionText, endCaption = latex:match(latexCaptionPattern)
  if #tblCaption > 0 then
    captionText = pandoc.utils.stringify(tblCaption)
  end
  -- escape special characters for LaTeX
  captionText = stringEscape(captionText, "latex")
  if #tblLabel > 0 then
    captionText = captionText .. " {#" .. tblLabel .. "}"
  end
  latex = latex:gsub(latexCaptionPattern, "%1" .. captionText:gsub("%%", "%%%%") .. "%3", 1)
  return latex
end


function extractTblCapAttrib(el, name, subcap)
  local value = attribute(el, name, nil)
  if value then
    if startsWith(value, "[") then
      value = pandoc.List(quarto.json.decode(value))
    elseif subcap and (value == "true") then
      value = pandoc.List({ "" })
    else
      value = pandoc.List({ value })
    end
    el.attr.attributes[name] = nil
    return value
  end
  return nil
end

-- table-rawhtml.lua
-- Copyright (C) 2020 by RStudio, PBC

-- flextable outputs consecutive html blocks so we merge them
-- back together here so they can be processed by ourraw  table
-- caption handling
function tableMergeRawHtml()
  if _quarto.format.isHtmlOutput() then
    return {
      Blocks = function(blocks)
        local pendingRaw = ''
        local merged = pandoc.List()
        for i,el in ipairs(blocks) do
          if _quarto.format.isRawHtml(el) and el.text:find(htmlTableTagNamePattern()) then
            pendingRaw = pendingRaw .. "\n" .. el.text
          else
            if #pendingRaw > 0 then
              merged:insert(pandoc.RawBlock("html", pendingRaw))
              pendingRaw = ''
            end
            merged:insert(el)
          end
        end
        if #pendingRaw > 0 then
          merged:insert(pandoc.RawBlock("html", pendingRaw))
        end
        return merged
      end
    }
  else
    return {

    }
  end
end

-- re-emits GT's CSS with lower specificity
function respecifyGtCSS(text)
  local s, e, v = text:find('<div id="([a-z]+)"')
  return text:gsub("\n#" .. v, "\n:where(#" .. v .. ")")
end

function tableRenderRawHtml() 
  return {
    RawBlock = function(el)
      if hasGtHtmlTable(el) then
        el.text = respecifyGtCSS(el.text)
      end
      if _quarto.format.isRawHtml(el) then
        -- if we have a raw html table in a format that doesn't handle raw_html
        -- then have pandoc parse the table into a proper AST table block
        if not _quarto.format.isHtmlOutput() and not _quarto.format.isMarkdownWithHtmlOutput() and not _quarto.format.isIpynbOutput() then
          local tableBegin,tableBody,tableEnd = el.text:match(htmlTablePattern())
          if tableBegin then
            local tableHtml = tableBegin .. "\n" .. tableBody .. "\n" .. tableEnd
            local tableDoc = pandoc.read(tableHtml, "html")
            return tableDoc.blocks
          end
        end
      end
      return el
    end
  }
end

-- figures.lua
-- Copyright (C) 2020 by RStudio, PBC


function figures() 
  
  return {
   
    Div = function(el)
      
      -- propagate fig-cap on figure div to figure caption 
      if hasFigureRef(el) then
        local figCap = attribute(el, kFigCap, nil)
        if figCap ~= nil then
          local caption = pandoc.Para(markdownToInlines(figCap))
          el.content:insert(caption)
          el.attr.attributes[kFigCap] = nil
        end
      end
      return el
      
    end,
    
    -- create figure divs from linked figures
    Para = function(el)
      
      -- create figure div if there is a tikz image
      local fig = discoverFigure(el)
      if fig and latexIsTikzImage(fig) then
        return createFigureDiv(el, fig)
      end
      
      -- create figure divs from linked figures
      local linkedFig = discoverLinkedFigure(el)
      if linkedFig then
        return createFigureDiv(el, linkedFig)
      end

    end,

    Image = function(image)
      -- propagate fig-alt
      if _quarto.format.isHtmlOutput() then
        -- read the fig-alt text and set the image alt
        local altText = attribute(image, kFigAlt, nil);
        if altText ~= nil then
          image.attr.attributes["alt"] = altText
          image.attr.attributes[kFigAlt] = nil
          return image
        end
      -- provide default fig-pos or fig-env if specified
      elseif _quarto.format.isLatexOutput() then
        local figPos = param(kFigPos)
        if figPos and not image.attr.attributes[kFigPos] then
          image.attr.attributes[kFigPos] = figPos
        end
        local figEnv = param(kFigEnv)
        if figEnv and not image.attr.attributes[kFigEnv] then
          image.attr.attributes[kFigEnv] = figPos
        end
      else 
        return image
      end
    end
  }
end






function outputs()
  return {
    -- unroll output divs for formats (like pptx) that don't support them
    Div = function(div)

      -- if we don't support output divs then we need to unroll them
      if not param("output-divs", true) then
        if tcontains(div.attr.classes, "cell") then
          -- if this is PowerPoint and it's a figure panel then let it through (as
          -- we'll use PowerPoint columns to layout at least 2 figures side-by-side)
          if _quarto.format.isPowerPointOutput() and hasLayoutAttributes(div) then
            return nil
          end
  
          -- unroll blocks contained in divs
          local blocks = pandoc.List()
          for _, childBlock in ipairs(div.content) do
            if childBlock.t == "Div" then
              tappend(blocks, childBlock.content)
            else
              blocks:insert(childBlock)
            end
          end
      
          return blocks
        end
      end
    end
  }
end

-- shortcodes-handlers.lua
-- Copyright (C) 2020 by RStudio, PBC

-- handlers process shortcode into either a list of inlines or into a list of blocks
   
local function shortcodeMetatable(scriptFile) 
  return {
    -- https://www.lua.org/manual/5.3/manual.html#6.1
    assert = assert,
    collectgarbage = collectgarbage,
    dofile = dofile,
    error = error,
    getmetatable = getmetatable,
    ipairs = ipairs,
    load = load,
    loadfile = loadfile,
    next = next,
    pairs = pairs,
    pcall = pcall,
    print = print,
    rawequal = rawequal,
    rawget = rawget,
    rawlen = rawlen,
    rawset = rawset,
    select = select,
    setmetatable = setmetatable,
    tonumber = tonumber,
    tostring = tostring,
    type = type,
    _VERSION = _VERSION,
    xpcall = xpcall,
    coroutine = coroutine,
    require = require,
    package = package,
    string = string,
    utf8 = utf8,
    table = table,
    math = math,
    io = io,
---@diagnostic disable-next-line: undefined-global
    file = file,
    os = os,
    debug = debug,
    -- https://pandoc.org/lua-filters.html
    FORMAT = FORMAT,
    PANDOC_READER_OPTIONS = PANDOC_READER_OPTIONS,
    PANDOC_WRITER_OPTIONS = PANDOC_WRITER_OPTIONS,
    PANDOC_VERSION = PANDOC_VERSION,
    PANDOC_API_VERSION = PANDOC_API_VERSION,
    PANDOC_SCRIPT_FILE = scriptFile,
    PANDOC_STATE = PANDOC_STATE,
    pandoc = pandoc,
    lpeg = lpeg,
    re = re,
    -- quarto functions
    quarto = quarto
  }
end

local handlers = {}

function initShortcodeHandlers()

  -- user provided handlers
  local shortcodeFiles = pandoc.List(param("shortcodes", {}))
  for _,shortcodeFile in ipairs(shortcodeFiles) do
    local env = setmetatable({}, {__index = shortcodeMetatable(shortcodeFile)})
    local chunk, err = loadfile(shortcodeFile, "bt", env)
    if chunk ~= nil and not err then
      local result = chunk()
      if result then
        for k,v in pairs(result) do
          handlers[k] = {
            file = shortcodeFile,
            handle = v
          }
        end
      else
        for k,v in pairs(env) do
          handlers[k] = {
            file = shortcodeFile,
            handle = v
          }
        end
      end
    else
      error(err)
      os.exit(1)
    end
  end


  -- built in handlers (these override any user handlers)
  handlers['meta'] = { handle = handleMeta }
  handlers['var'] = { handle = handleVars }
  handlers['env'] = { handle = handleEnv }
  handlers['pagebreak'] = { handle = handlePagebreak }
end

function handlerForShortcode(shortCode)
  return handlers[shortCode.name]
end


-- Implements reading values from envrionment variables
function handleEnv(args)
  if #args > 0 then
    -- the args are the var name
    local varName = inlinesToString(args[1])

    -- read the environment variable
    local envValue = os.getenv(varName)
    if envValue ~= nil then
      return { pandoc.Str(envValue) }  
    else 
      warn("Unknown variable " .. varName .. " specified in an env Shortcode.")
      return { pandoc.Strong({pandoc.Str("?env:" .. varName)}) } 
    end
  else
    -- no args, we can't do anything
    return nil
  end
end

-- Implements reading values from document metadata
-- as {{< meta title >}}
-- or {{< meta key.subkey.subkey >}}
-- This only supports emitting simple types (not arrays or maps)
function handleMeta(args) 
  if #args > 0 then
    -- the args are the var name
    local varName = inlinesToString(args[1])

    -- read the option value
    local optionValue = option(varName, nil)
    if optionValue ~= nil then
      return processValue(optionValue, varName, "meta")
    else 
      warn("Unknown meta key " .. varName .. " specified in a metadata Shortcode.")
      return { pandoc.Strong({pandoc.Str("?meta:" .. varName)}) } 
    end
  else
    -- no args, we can't do anything
    return nil
  end
end

-- Implements reading variables from quarto vars file
-- as {{< var title >}}
-- or {{< var key.subkey.subkey >}}
-- This only supports emitting simple types (not arrays or maps)
function handleVars(args) 
  if #args > 0 then
    
    -- the args are the var name
    local varName = inlinesToString(args[1])
    
    -- read the option value
    local varValue = var(varName, nil)
    if varValue ~= nil then
      return processValue(varValue, varName, "var")
    else 
      warn("Unknown var " .. varName .. " specified in a var shortcode.")
      return { pandoc.Strong({pandoc.Str("?var:" .. varName)}) } 
    end

  else
    -- no args, we can't do anything
    return nil
  end
end

function processValue(val, name, t)    
  if type(val) == "table" then
    if #val == 0 then
      return { pandoc.Str( "") }
    elseif pandoc.utils.type(val) == "Inlines" then
      return val
    elseif pandoc.utils.type(val) == "Blocks" then
      return pandoc.utils.blocks_to_inlines(val)
    elseif pandoc.utils.type(val) == "List" and #val == 1 then
      return processValue(val[1])
    else
      warn("Unsupported type '" .. pandoc.utils.type(val)  .. "' for key " .. name .. " in a " .. t .. " shortcode.")
      return { pandoc.Strong({pandoc.Str("?invalid " .. t .. " type:" .. name)}) }         
    end
  else 
    return { pandoc.Str( tostring(val) ) }  
  end
end


function handlePagebreak()
 
  local pagebreak = {
    epub = '<p style="page-break-after: always;"> </p>',
    html = '<div style="page-break-after: always;"></div>',
    latex = '\\newpage{}',
    ooxml = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
    odt = '<text:p text:style-name="Pagebreak"/>',
    context = '\\page'
  }

  if FORMAT == 'docx' then
    return pandoc.RawBlock('openxml', pagebreak.ooxml)
  elseif FORMAT:match 'latex' then
    return pandoc.RawBlock('tex', pagebreak.latex)
  elseif FORMAT:match 'odt' then
    return pandoc.RawBlock('opendocument', pagebreak.odt)
  elseif FORMAT:match 'html.*' then
    return pandoc.RawBlock('html', pagebreak.html)
  elseif FORMAT:match 'epub' then
    return pandoc.RawBlock('html', pagebreak.epub)
  elseif FORMAT:match 'context' then
    return pandoc.RawBlock('context', pagebreak.context)
  else
    -- fall back to insert a form feed character
    return pandoc.Para{pandoc.Str '\f'}
  end

end

-- shortcodes.lua
-- Copyright (C) 2020 by RStudio, PBC


-- The open and close shortcode indicators
local kOpenShortcode = "{{<"
local kOpenShortcodeEscape = "/*"
local kCloseShortcode = ">}}"
local kCloseShortcodeEscape = "*/"

function shortCodesBlocks() 
  return {
    Blocks = transformShortcodeBlocks,
    CodeBlock =  transformShortcodeCode,
    RawBlock = transformShortcodeCode
  }
end

function shortCodesInlines() 

  return {
    Inlines = transformShortcodeInlines,
    Code = transformShortcodeCode,
    RawInline = transformShortcodeCode,
    Link = transformLink,
    Image = transformImage
  }
end

-- transforms shortcodes in link targets
function transformLink(el)
  local target = urldecode(el.target)
  local tranformed = transformString(target);
  if tranformed ~= nil then
    el.target = tranformed
    return el
  end
end

-- transforms shortcodes in img srcs
function transformImage(el)
  local target = urldecode(el.src)
  local tranformed = transformString(target);
  if tranformed ~= nil then
    el.src = tranformed
    return el
  end
end

-- transforms shortcodes inside code
function transformShortcodeCode(el)

  -- don't process shortcodes in code output from engines
  -- (anything in an engine processed code block was actually
  --  proccessed by the engine, so should be printed as is)
  if el.attr and el.attr.classes:includes("cell-code") then
    return
  end

  -- don't process shortcodes if they are explicitly turned off
  if el.attr and el.attr.attributes["shortcodes"] == "false" then
    return
  end
  
  -- process shortcodes
  local text = el.text:gsub("(%{%{%{*<)" ..  "(.-)" .. "(>%}%}%}*)", function(beginCode, code, endCode) 
    if #beginCode > 3 or #endCode > 3 then
      return beginCode:sub(2) .. code .. endCode:sub(1, #endCode-1)
    else
      -- see if any of the shortcode handlers want it (and transform results to plain text)
      local inlines = markdownToInlines(kOpenShortcode .. code .. kCloseShortcode)
      local transformed = transformShortcodeInlines(inlines, true)
      if transformed ~= nil then
        -- need to undo fancy quotes
        local str = ''
        for _,inline in ipairs(transformed) do
          if inline.t == "Quoted" then
            local quote = '"'
            if inline.quotetype == "SingleQuote" then
              quote = "'"
            end
            str = str .. quote .. inlinesToString(inline.content) .. quote
          else
            str = str .. pandoc.utils.stringify(inline)
          end
        end
        return str
      else
        return beginCode .. code .. endCode
      end
    end
  end)

  -- return new element if the text changd
  if text ~= el.text then
    el.text = text
    return el
  end
end

-- finds blocks that only contain a shortcode and processes them
function transformShortcodeBlocks(blocks) 
  local transformed = false
  local scannedBlocks = pandoc.List()
  
  for i,block in ipairs(blocks) do 
    -- inspect para and plain blocks for shortcodes
    if block.t == "Para" or block.t == "Plain" then

      -- if contents are only a shortcode, process and return
      local onlyShortcode = onlyShortcode(block.content)
      if onlyShortcode ~= nil then
        -- there is a shortcode here, process it and return the blocks
        local shortCode = processShortCode(onlyShortcode)
        local handler = handlerForShortcode(shortCode)
        if handler ~= nil then
          local transformedShortcode = callShortcodeHandler(handler, shortCode)
          if transformedShortcode ~= nil then
            tappend(scannedBlocks, shortcodeResultAsBlocks(transformedShortcode, shortCode.name))
            transformed = true                  
          end
        else
          scannedBlocks:insert(block)
        end
      else 
        scannedBlocks:insert(block)
      end
    else
      scannedBlocks:insert(block)
    end
  end
  
  -- if we didn't transform any shortcodes, just return nil to signal
  -- no changes
  if transformed then
    return scannedBlocks
  else
    return nil
  end
end

-- helper function to read metadata options
local function readMetadata(value)
  -- We were previously coercing everything to lists of inlines when possible
  -- which made for some simpler treatment of values in meta, but it also
  -- meant that reading meta here was different than reading meta in filters
  -- 
  -- This is now just returning the raw meta value and not coercing it, so 
  -- users will have to be more thoughtful (or just use pandoc.utils.stringify)
  --
  -- Additionally, this used to return an empty list of inlines but now
  -- it returns nil for an unset value
  return option(value, nil)
end

-- call a handler w/ args & kwargs
function callShortcodeHandler(handler, shortCode)
  local args = pandoc.List()
  local kwargs = setmetatable({}, { __index = function () return pandoc.Inlines({}) end })
  for _,arg in ipairs(shortCode.args) do
    if arg.name then
      kwargs[arg.name] = arg.value
    else
      args:insert(arg.value)
    end
  end
  local meta = setmetatable({}, { __index = function(t, i) 
    return readMetadata(i)
  end})

  -- set the script file path, if present
  if handler.file ~= nil then
    _quarto.scriptFile(handler.file)
  end
  local result = handler.handle(args, kwargs, meta)

  -- clear the scsript file path
  _quarto.scriptFile(nil)

  return result;
end

-- scans through a list of inlines, finds shortcodes, and processes them
function transformShortcodeInlines(inlines, noRawInlines) 
  local transformed = false
  local outputInlines = pandoc.List()
  local shortcodeInlines = pandoc.List()
  local accum = outputInlines
  
  -- iterate through any inlines and process any shortcodes
  for i, el in ipairs(inlines) do

    if el.t == "Str" then 

      -- find escaped shortcodes
      local beginEscapeMatch = el.text:match("%{%{%{+<$")
      local endEscapeMatch = el.text:match("^>%}%}%}+")

      -- handle {{{< shortcode escape
      if beginEscapeMatch then
        transformed = true
        local prefixLen = #el.text - #beginEscapeMatch
        if prefixLen > 0 then
          accum:insert(pandoc.Str(el.text:sub(1, prefixLen)))
        end
        accum:insert(pandoc.Str(beginEscapeMatch:sub(2)))
        
      -- handle >}}} shortcode escape
      elseif endEscapeMatch then
        transformed = true
        local suffixLen = #el.text - #endEscapeMatch
        accum:insert(pandoc.Str(endEscapeMatch:sub(1, #endEscapeMatch-1)))
        if suffixLen > 0 then
          accum:insert(pandoc.Str(el.text:sub(#endEscapeMatch + 1)))
        end

      -- handle shortcode escape -- e.g. {{</* shortcode_name */>}}
      elseif endsWith(el.text, kOpenShortcode .. kOpenShortcodeEscape) then
        -- This is an escape, so insert the raw shortcode as text (remove the comment chars)
        transformed = true
        accum:insert(pandoc.Str(kOpenShortcode))
        

      elseif startsWith(el.text, kCloseShortcodeEscape .. kCloseShortcode) then 
        -- This is an escape, so insert the raw shortcode as text (remove the comment chars)
        transformed = true
        accum:insert(pandoc.Str(kCloseShortcode))

      elseif endsWith(el.text, kOpenShortcode) then
        -- note that the text might have other text with it (e.g. a case like)
        -- This is my inline ({{< foo bar >}}).
        -- Need to pare off prefix and suffix and preserve them
        local prefix = el.text:sub(1, #el.text - #kOpenShortcode)
        if prefix then
          accum:insert(pandoc.Str(prefix))
        end

        -- the start of a shortcode, start accumulating the shortcode
        accum = shortcodeInlines
        accum:insert(pandoc.Str(kOpenShortcode))
      elseif startsWith(el.text, kCloseShortcode) then

        -- since we closed a shortcode, mark this transformed
        transformed = true

        -- the end of the shortcode, stop accumulating the shortcode
        accum:insert(pandoc.Str(kCloseShortcode))
        accum = outputInlines

        -- process the shortcode
        local shortCode = processShortCode(shortcodeInlines)

        -- find the handler for this shortcode and transform
        local handler = handlerForShortcode(shortCode)
        if handler ~= nil then
          local expanded = callShortcodeHandler(handler, shortCode)
          if expanded ~= nil then
            -- process recursively
            expanded = shortcodeResultAsInlines(expanded, shortCode.name)
            local expandedAgain = transformShortcodeInlines(expanded, noRawInlines)
            if (expandedAgain ~= nil) then
              tappend(accum, expandedAgain)
            else
              tappend(accum, expanded)
            end
          end
        else
          if noRawInlines then
            tappend(accum, shortcodeInlines)
          else
            accum:insert(pandoc.RawInline("markdown", inlinesToString(shortcodeInlines)))
          end
        end

        local suffix = el.text:sub(#kCloseShortcode + 1)
        if suffix then
          accum:insert(pandoc.Str(suffix))
        end   

        -- clear the accumulated shortcode inlines
        shortcodeInlines = pandoc.List()        
      else 
        -- not a shortcode, accumulate
        accum:insert(el)
      end
    else
      -- not a string, accumulate
      accum:insert(el)
    end
  end
  
  if transformed then
    return outputInlines
  else
    return nil
  end

end

-- transforms shorts in a string
function transformString(str)
  if string.find(str, kOpenShortcode) then
    local inlines = markdownToInlines(str)
    if inlines ~= nil and #inlines > 0 then 
      local mutatedTarget = transformShortcodeInlines(inlines)
      if mutatedTarget ~= nil then
        return inlinesToString(mutatedTarget)
      end      
    end
  end  
  return nil
end

-- processes inlines into a shortcode data structure
function processShortCode(inlines) 

  local kSep = "="
  local shortCode = nil
  local args = pandoc.List()

  -- slice off the open and close tags
  inlines = tslice(inlines, 2, #inlines - 1)

  -- handling for names with accompanying values
  local pendingName = nil
  notePendingName = function(el)
    pendingName = el.text:sub(1, -2)
  end

  -- Adds an argument to the args list (either named or unnamed args)
  insertArg = function(argInlines) 
    if pendingName ~= nil then
      -- there is a pending name, insert this arg
      -- with that name
      args:insert(
        {
          name = pendingName,
          value = argInlines
        })
      pendingName = nil
    else
      -- split the string on equals
      if #argInlines == 1 and argInlines[1].t == "Str" and string.match(argInlines[1].text, kSep) then 
        -- if we can, split the string and assign name / value arg
        -- otherwise just put the whole thing in unnamed
        local parts = split(argInlines[1].text, kSep)
        if #parts == 2 then 
          args:insert(
              { 
                name = parts[1], 
                value = stringToInlines(parts[2])
              })
        else
          args:insert(
            { 
              value = argInlines 
            })
        end
      -- a standalone SoftBreak or LineBreak is not an argument!
      -- (happens when users delimit args with newlines)
      elseif #argInlines > 1 or 
             (argInlines[1].t ~= "SoftBreak" and argInlines[1].t ~= "LineBreak") then
        -- this is an unnamed argument
        args:insert(
          { 
            value = argInlines
          })
      end
    end
  end

  -- The core loop
  for i, el in ipairs(inlines) do
    if el.t == "Str" then
      if shortCode == nil then
        -- the first value is a pure text code name
        shortCode = el.text
      else
        -- if we've already captured the code name, proceed to gather args
        if endsWith(el.text, kSep) then 
          -- this is the name of an argument
          notePendingName(el)
        else
          -- this is either an unnamed arg or an arg value
          insertArg({el})
        end
      end
    elseif el.t == "Quoted" then 
      -- this is either an unnamed arg or an arg value
      insertArg(el.content)
    elseif el.t ~= "Space" then
      insertArg({el})
    end
  end

  return {
    args = args,
    name = shortCode
  }
end

function onlyShortcode(contents)
  
  -- trim leading and trailing empty strings
  contents = trimEmpty(contents)

  if #contents < 1 then
    return nil
  end

  -- starts with a shortcode
  local startsWithShortcode = contents[1].t == "Str" and contents[1].text == kOpenShortcode
  if not startsWithShortcode then
    return nil
  end

  -- ends with a shortcode
  local endsWithShortcode = contents[#contents].t == "Str" and contents[#contents].text == kCloseShortcode
  if not endsWithShortcode then  
    return nil
  end

  -- has only one open shortcode
  local openShortcodes = filter(contents, function(el) 
    return el.t == "Str" and el.text == kOpenShortcode  
  end)
  if #openShortcodes ~= 1 then
    return nil
  end

  -- has only one close shortcode 
  local closeShortcodes = filter(contents, function(el) 
    return el.t == "Str" and el.text == kCloseShortcode  
  end) 
  if #closeShortcodes ~= 1 then
    return nil
  end
    
  return contents
end

function trimEmpty(contents) 
  local firstNonEmpty = 1
  for i, el in ipairs(contents) do
    if el.t == "Str" and el.text == "" then
      firstNonEmpty = firstNonEmpty + 1
    else
      break
    end
  end
  if firstNonEmpty > 1 then
    contents = tslice(contents, firstNonEmpty, #contents)
  end

  local lastNonEmptyEl = nil
  for i = #contents, 1, -1 do
    el = contents[i]
    if el.t == "Str" and el.text == "" then
      contents = tslice(contents, 1, #contents - 1)
    else
      break
    end
  end
  return contents
end


function shortcodeResultAsInlines(result, name)
  local type = pandoc.utils.type(result)
  if type == "Inlines" then
    return result
  elseif type == "Blocks" then
    return pandoc.utils.blocks_to_inlines(result, { pandoc.Space() })
  elseif type == "string" then
    return pandoc.Inlines( { pandoc.Str(result) })
  elseif tisarray(result) then
    local items = pandoc.List(result)
    local inlines = items:filter(isInlineEl)
    if #inlines > 0 then
      return pandoc.Inlines(inlines)
    else
      local blocks = items:filter(isBlockEl)
      return pandoc.utils.blocks_to_inlines(blocks, { pandoc.Space() })
    end
  elseif isInlineEl(result) then
    return pandoc.Inlines( { result })
  elseif isBlockEl(result) then
    return pandoc.utils.blocks_to_inlines( { result }, { pandoc.Space() })
  else
    error("Unexepected result from shortcode " .. name .. "")
    quarto.utils.dump(result)
    os.exit(1)
  end
end
  
function shortcodeResultAsBlocks(result, name)
  local type = pandoc.utils.type(result)
  if type == "Blocks" then
    return result
  elseif type == "Inlines" then
    return pandoc.Blocks( {pandoc.Para(result) })
  elseif type == "string" then
    return pandoc.Blocks( {pandoc.Para({pandoc.Str(result)})} )
  elseif tisarray(result) then
    local items = pandoc.List(result)
    local blocks = items:filter(isBlockEl)
    if #blocks > 0 then
      return pandoc.Blocks(blocks)
    else
      local inlines = items:filter(isInlineEl)
      return pandoc.Blocks({pandoc.Para(inlines)})
    end
  elseif isBlockEl(result) then
    return pandoc.Blocks( { result } )
  elseif isInlineEl(result) then
    return pandoc.Blocks( {pandoc.Para( {result} ) })
  else
    error("Unexepected result from shortcode " .. name .. "")
    quarto.utils.dump(result)
    os.exit(1)
  end
end


-- for code blocks w/ filename create an enclosing div:
-- <div class="code-with-filename">
--   <div class="code-with-filename-file">
--     <pre>filename.py</pre>
--   </div>
--   <div class="sourceCode" id="cb1" data-filename="filename.py">
--     <pre></pre>
--   </div>
-- </div>

local function codeBlockWithFilename(el, filename)
  if _quarto.format.isHtmlOutput() then
    local filenameEl = pandoc.Div({pandoc.Plain{
      pandoc.RawInline("html", "<pre>"),
      pandoc.Strong{pandoc.Str(filename)},
      pandoc.RawInline("html", "</pre>")
    }}, pandoc.Attr("", {"code-with-filename-file"}))
    return pandoc.Div(
      { filenameEl, el:clone() },
      pandoc.Attr("", {"code-with-filename"})
    )
  else
    return pandoc.Div(
      { pandoc.Plain{pandoc.Strong{pandoc.Str(filename)}}, el:clone() },
      pandoc.Attr("", {"code-with-filename"})
    )
  end
end

function codeFilename() 
  return {
    Blocks = function(blocks)
  
      -- transform ast for 'filename'
      local foundFilename = false
      local newBlocks = pandoc.List()
      for _,block in ipairs(blocks) do
        if block.attributes ~= nil and block.attributes["filename"] then
          local filename = block.attributes["filename"]
          if block.t == "CodeBlock" then
            foundFilename = true
            block.attributes["filename"] = nil
            newBlocks:insert(codeBlockWithFilename(block, filename))
          elseif block.t == "Div" and block.content[1].t == "CodeBlock" then
            foundFilename = true
            block.attributes["filename"] = nil
            block.content[1] = codeBlockWithFilename(block.content[1], filename)
            newBlocks:insert(block)
          else
            newBlocks:insert(block)
          end
        else
          newBlocks:insert(block)
        end
      end
    
      -- if we found a file name then return the modified list of blocks
      if foundFilename then
        return newBlocks
      else
        return blocks
      end
    end
  }  
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
  return parseOption(name, allOptions, def)
end

local kVarNamespace = "_quarto-vars"
function var(name, def)
  local vars = allOptions[kVarNamespace]
  if vars ~= nil then
    return parseOption(name, vars, def)
  else
    return nil
  end
end

function parseOption(name, options, def) 
  local keys = split(name, ".")

  local value = nil
  for i, key in ipairs(keys) do
    if value == nil then
      value = readOption(options, key, nil)
    else
      value = value[key]

      -- the key doesn't match a value, stop indexing
      if value == nil then
        break
      end
    end
  end
  if value == nil then
    return def
  else
    return value
  end
end

-- results.lua
-- Copyright (C) 2020 by RStudio, PBC


local function resultsFile()
  return pandoc.utils.stringify(param("results-file"))
end

local function timingsFile()
  return pandoc.utils.stringify(param("timings-file"))
end


-- write results
function writeResults()
  return {
    Pandoc = function(doc)
      local jsonResults = quarto.json.encode(preState.results)
      local rfile = io.open(resultsFile(), "w")
      if rfile then
        rfile:write(jsonResults)
        rfile:close()
      else
        warn('Error writing LUA results file')
      end

      if os.getenv("QUARTO_PROFILER_OUTPUT") ~= nil then

        local jsonTimings = quarto.json.encode(timing_events)
        local tfile = io.open(timingsFile(), "w")
        if tfile then
          tfile:write(jsonTimings)
          tfile:close()
        else
          warn('Error writing profiler timings JSON')
        end
      end
    end
  }
end


-- timing.lua
-- Copyright (C) 2022 by RStudio, PBC

-- https://stackoverflow.com/questions/463101/lua-current-time-in-milliseconds :(
function get_current_time()
  -- FIXME this will not necessarily work on windows..
  local handle = io.popen("python -c 'import time; print(time.time() * 1000)'")
  if handle then
    local result = tonumber(handle:read("*a"))
    handle:close()
    return result
  else
    fail('Error reading current time')
  end
end

if os.getenv("QUARTO_PROFILER_OUTPUT") ~= nil then
  timing_events = { { name = "_start", time = get_current_time() } }
else
  timing_events = {}
end

function register_time(event_name)
  local t = get_current_time()
  table.insert(timing_events, { 
    time = t,
    name = event_name
  })
end

function capture_timings(filterList)
  local finalResult = {}

  if os.getenv("QUARTO_PROFILER_OUTPUT") ~= nil then
    for i, v in ipairs(filterList) do
      local newFilter = {}
      local oldPandoc = v["filter"]["Pandoc"]
      for key,func in pairs(v) do
        newFilter[key] = func
      end
      function makeNewFilter(oldPandoc)
        return function (p)
          if oldPandoc ~= nil then
            local result = oldPandoc(p)
            register_time(v["name"])
            return result
          else
            register_time(v["name"])
          end
        end 
      end
      newFilter["Pandoc"] = makeNewFilter(oldPandoc) -- iife for capturing in scope
      table.insert(finalResult, newFilter)
    end
  else
    for i, v in ipairs(filterList) do
      table.insert(finalResult, v["filter"])
    end
  end

  return finalResult
end

-- paths.lua
-- Copyright (C) 2022 by RStudio, PBC

function resourceRef(ref, dir)
  -- if the ref starts with / then just strip if off
  if string.find(ref, "^/") then
    -- check for protocol relative url
    if string.find(ref, "^//") == nil then
      return pandoc.text.sub(ref, 2, #ref)
    else
      return ref
    end
  -- if it's a relative ref then prepend the resource dir
  elseif isRelativeRef(ref) then
    return dir .. "/" .. ref
  else
  -- otherwise just return it
    return ref
  end
end

function fixIncludePath(ref, dir)
  -- if it's a relative ref then prepend the resource dir
  if isRelativeRef(ref) then
    if dir ~= "." then
      return dir .. "/" .. ref
    else
      return ref
    end
  else
  -- otherwise just return it
    return ref
  end
end


function isRelativeRef(ref)
  return ref:find("^/") == nil and 
         ref:find("^%a+://") == nil and 
         ref:find("^data:") == nil and 
         ref:find("^#") == nil
end



function handlePaths(el, path, replacer)
  el.text = handleHtmlRefs(el.text, path, "img", "src", replacer)
  el.text = handleHtmlRefs(el.text, path, "img", "data-src", replacer)
  el.text = handleHtmlRefs(el.text, path, "link", "href", replacer)
  el.text = handleHtmlRefs(el.text, path, "script", "src", replacer)
  el.text = handleHtmlRefs(el.text, path, "source", "src", replacer)
  el.text = handleHtmlRefs(el.text, path, "embed", "src", replacer)
  el.text = handleCssRefs(el.text, path, "@import%s+", replacer)
  el.text = handleCssRefs(el.text, path, "url%(", replacer)
end


function handleHtmlRefs(text, resourceDir, tag, attrib, replacer)
  return text:gsub("(<" .. tag .. " [^>]*" .. attrib .. "%s*=%s*)\"([^\"]+)\"", function(preface, value)
    return preface .. "\"" .. replacer(value, resourceDir) .. "\""
  end)
end

function handleCssRefs(text, resourceDir, prefix, replacer)
  return text:gsub("(" .. prefix .. ")\"([^\"]+)\"", function(preface, value)
    return preface .. "\"" .. replacer(value, resourceDir) .. "\""
  end) 
end

-- url.lua
-- Copyright (C) 2020 by RStudio, PBC

function urldecode(url)
  if url == nil then
  return
  end
    url = url:gsub("+", " ")
    url = url:gsub("%%(%x%x)", function(x)
      return string.char(tonumber(x, 16))
    end)
  return url
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

-- list.lua
-- Copyright (C) 2020 by RStudio, PBC

function filter(list, test) 
  local result = {}
  for index, value in ipairs(list) do
      if test(value, index) then
          result[#result + 1] = value
      end
  end
  return result
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

-- format.lua
-- Copyright (C) 2020 by RStudio, PBC

function round(num, numDecimalPlaces)
  local mult = 10^(numDecimalPlaces or 0)
  return math.floor(num * mult + 0.5) / mult
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

-- debug.lua
-- Copyright (C) 2020 by RStudio, PBC





function fail(message)
  local file = currentFile()
  if file then
    print("An error occurred while processing '" .. file .. "'")
  else
    print("An error occurred")
  end
  print(message)
  os.exit(1)
end


function currentFile() 
  
  if currentFileMetadataState ~= nil then
    -- if we're in a multifile contatenated render, return which file we're rendering
    local fileState = currentFileMetadataState()
    if fileState ~= nil and fileState.file ~= nil and fileState.file.bookItemFile ~= nil then
      return fileState.file.bookItemFile
    elseif fileState ~= nil and fileState.include_directory ~= nil then
      return fileState.include_directory
    else
      return nil
    end
  else
    -- if we're not in a concatenated scenario, file name doesn't really matter since the invocation is only
    -- targeting a single file
    return nil
  end
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


-- quarto-pre.lua
-- Copyright (C) 2020 by RStudio, PBC

-- required version
PANDOC_VERSION:must_be_at_least '2.13'

-- global state
preState = {
  usingBookmark = false,
  usingTikz = false,
  results = {
    resourceFiles = pandoc.List({}),
    inputTraits = {}
  },
  file = nil,
  appendix = false,
  fileSectionIds = {}
}




initShortcodeHandlers()

local filterList = {
  { name = "init", filter = initOptions() },
  { name = "bibliographyFormats", filter = bibliographyFormats() },
  { name = "shortCodesBlocks", filter = shortCodesBlocks() } ,
  { name = "shortCodesInlines", filter = shortCodesInlines() },
  { name = "tableMergeRawHtml", filter = tableMergeRawHtml() },
  { name = "tableRenderRawHtml", filter = tableRenderRawHtml() },
  { name = "tableColwidthCell", filter = tableColwidthCell() },
  { name = "tableColwidth", filter = tableColwidth() },
  { name = "hidden", filter = hidden() },
  { name = "contentHidden", filter = contentHidden() },
  { name = "tableCaptions", filter = tableCaptions() },
  { name = "outputs", filter = outputs() },
  { name = "outputLocation", filter = outputLocation() },
  { name = "combined-figures-theorems-etc", filter = combineFilters({
    fileMetadata(),
    indexBookFileTargets(),
    bookNumbering(),
    includePaths(),
    resourceFiles(),
    figures(),
    theorems(),
    callout(),
    codeFilename(),
    lineNumbers(),
    engineEscape(),
    panelInput(),
    panelTabset(),
    panelLayout(),
    panelSidebar(),
    inputTraits()
  }) },
  { name = "combined-book-file-targets", filter = combineFilters({
    fileMetadata(),
    resolveBookFileTargets(),
  }) },
  { name = "quartoPreMetaInject", filter = quartoPreMetaInject() },
  { name = "writeResults", filter = writeResults() },
  { name = "projectPaths", filter = projectPaths()}
}

return capture_timings(filterList)
