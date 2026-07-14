# minicode

Упрощенный, CLI-friendly AI агент для программирования, вдохновленный OpenCode. Создан для разработчиков, которым нужен минималистичный опыт с тонкой настройкой. Это игрушечный проект (не production-ready и никогда не будет). 

## Возможности

### Базовый функционал

- **Sticky REPL с поддержкой escape** - Интерактивный интерфейс командной строки с корректной обработкой ввода
- **Основной цикл** - Непрерывный цикл диалога для бесшовного взаимодействия
- **Система конфигурации** - Централизованный конфиг для простой кастомизации
- **Выбор модели** - Выбирайте предпочитаемую AI модель через конфигурацию
- **Список моделей** - Просматривайте доступные модели
- **Выполнение инструментов** - Выполняйте инструменты и команды напрямую из агента

### Запланированные возможности

+ MCP -> toolbox
+ real mcp support
+ session (restore, export with prompt, fork, back)
+ ya mcp
+ agents.md
+ skills awd/cwd/pwd
+ delegation (save context / new context) + async
+ interruption

-- plugins

+ plugins support
+ session info plugin + costs
+ todos plugin

-- better core

+ delegation evaluation + rigid todo for delegation
+ evaluation / plans for coding (skill?)
+ one shot mode
+ compaction with prompt + sliding window + pins
+ context manual cleanup

+ tools protection
+ auto update skills
+ self config update + self install mcp

+ ssh files
+ multi windows?

+ chat search
+ revert?

+ step / iteration highlights
+ limits for step / delegation

-- autonomy

+ daemons / queues and workers

-- integrations

+ figma mcp
+ puppeteer mcp

-- backlog

+ research reasoning
+ fake reasoning through delegation?
