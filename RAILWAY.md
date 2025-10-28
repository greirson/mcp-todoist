# Развертывание MCP Todoist Server на Railway

Это руководство описывает процесс развертывания MCP Todoist Server на платформе Railway.

## Что изменилось для Railway

Для поддержки развертывания на Railway были добавлены следующие компоненты:

### Новые файлы

1. **`src/http-server.ts`** - HTTP сервер с SSE (Server-Sent Events) transport
   - Использует Express для HTTP endpoints
   - Поддерживает MCP protocol через SSE
   - Включает health check endpoint для Railway

2. **`railway.json`** - Конфигурация Railway deployment
   - Определяет builder (NIXPACKS)
   - Настраивает health checks
   - Определяет restart policy

3. **`Procfile`** - Альтернативная конфигурация запуска
   - Определяет web процесс для Railway

### Обновленные файлы

1. **`package.json`**
   - Добавлена зависимость: `express`
   - Добавлена dev зависимость: `@types/express`
   - Новые скрипты:
     - `npm start` - запускает HTTP сервер (для Railway)
     - `npm run start:stdio` - запускает stdio сервер (для локального использования)

2. **`Dockerfile`**
   - Обновлен для поддержки HTTP режима по умолчанию
   - Добавлен EXPOSE 3000
   - CMD изменен на `npm start` (вместо stdio режима)

## Быстрый старт: Развертывание на Railway

### Предварительные требования

1. Аккаунт на [Railway.app](https://railway.app)
2. Todoist API токен (получите на [Todoist Settings → Integrations](https://todoist.com/app/settings/integrations))
3. GitHub репозиторий с этим кодом (или используйте существующий fork)

### Шаг 1: Создание нового проекта на Railway

1. Войдите на [Railway.app](https://railway.app)
2. Нажмите **"New Project"**
3. Выберите **"Deploy from GitHub repo"**
4. Выберите ваш репозиторий `mcp-todoist`

### Шаг 2: Настройка переменных окружения

После создания проекта, перейдите в **Variables** и добавьте:

**Обязательные переменные:**

```
TODOIST_API_TOKEN=your_todoist_api_token_here
MCP_AUTH_TOKEN=your_secure_random_token_here
```

**Генерация безопасного токена для MCP_AUTH_TOKEN:**

```bash
# С помощью openssl
openssl rand -base64 32

# С помощью Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Или онлайн генератор: https://www.random.org/strings/
```

**Опционально:** Для тестирования в dry-run режиме добавьте:
```
DRYRUN=true
```

### ⚠️ Безопасность

**MCP_AUTH_TOKEN** защищает ваш HTTP endpoint от несанкционированного доступа:
- Требуется для всех запросов к `/sse` и `/message`
- Передается через HTTP заголовок: `Authorization: Bearer YOUR_TOKEN`
- Публичные endpoints (`/health`, `/`) не требуют аутентификации
- **Никогда не коммитьте токены в репозиторий** - используйте только переменные окружения Railway

### Шаг 3: Настройка домена (опционально)

Railway автоматически предоставляет домен вида `your-app.railway.app`.

Для использования кастомного домена:
1. Перейдите в **Settings → Domains**
2. Добавьте ваш домен
3. Настройте DNS записи согласно инструкциям Railway

### Шаг 4: Deploy

Railway автоматически:
1. Обнаружит `railway.json` конфигурацию
2. Установит зависимости через npm
3. Соберет TypeScript код
4. Запустит сервер командой `npm start`
5. Настроит health checks на `/health` endpoint

### Шаг 5: Проверка развертывания

После успешного deploy:

1. **Health Check**: Откройте `https://your-app.railway.app/health`
   ```json
   {
     "status": "healthy",
     "service": "todoist-mcp-server",
     "version": "0.8.8",
     "transport": "sse"
   }
   ```

2. **Server Info**: Откройте `https://your-app.railway.app/`
   ```json
   {
     "name": "Todoist MCP Server",
     "version": "0.8.8",
     "description": "MCP server for Todoist API over HTTP/SSE",
     "endpoints": {
       "health": "/health",
       "sse": "/sse"
     },
     "tools": 28
   }
   ```

3. **SSE Endpoint**: `https://your-app.railway.app/sse`
   - Этот endpoint используется для MCP клиентов

## Использование развернутого сервера

### С MCP клиентом

Используйте SSE endpoint для подключения MCP клиента:

```
https://your-app.railway.app/sse
```

### Мониторинг

Railway предоставляет:
- **Logs**: Просмотр логов приложения в реальном времени
- **Metrics**: CPU, Memory, Network usage
- **Health Checks**: Автоматический мониторинг `/health` endpoint

## Архитектурные отличия

### Stdio режим (локальный, Claude Desktop)
```
Claude Desktop <--> stdin/stdout <--> MCP Server <--> Todoist API
```

### HTTP/SSE режим (Railway)
```
MCP Client <--> HTTP/SSE <--> Express Server <--> MCP Server <--> Todoist API
```

## Endpoints

| Endpoint | Метод | Аутентификация | Описание |
|----------|-------|----------------|----------|
| `/` | GET | ❌ Нет | Информация о сервере |
| `/health` | GET | ❌ Нет | Health check для Railway |
| `/sse` | GET | ✅ Требуется | SSE endpoint для MCP protocol |
| `/message` | POST | ✅ Требуется | Обработка SSE сообщений |

### Использование защищенных endpoints

Защищенные endpoints требуют заголовок `Authorization`:

```bash
# Пример с curl
curl -H "Authorization: Bearer YOUR_MCP_AUTH_TOKEN" \
     https://your-app.railway.app/sse

# Пример с fetch (JavaScript)
fetch('https://your-app.railway.app/sse', {
  headers: {
    'Authorization': 'Bearer YOUR_MCP_AUTH_TOKEN'
  }
})
```

## Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `TODOIST_API_TOKEN` | ✅ Да | API токен Todoist |
| `MCP_AUTH_TOKEN` | ✅ Да | Токен аутентификации для HTTP endpoints |
| `PORT` | ❌ Нет | Порт сервера (Railway устанавливает автоматически) |
| `DRYRUN` | ❌ Нет | Режим сухого запуска (true/false) |

## Локальное тестирование HTTP режима

Для тестирования HTTP сервера локально:

```bash
# Установите зависимости
npm install

# Соберите проект
npm run build

# Создайте .env файл
cp .env.example .env

# Отредактируйте .env и добавьте токены:
# TODOIST_API_TOKEN=your_todoist_token
# MCP_AUTH_TOKEN=your_generated_token

# Или установите переменные окружения напрямую
export TODOIST_API_TOKEN="your_todoist_token"
export MCP_AUTH_TOKEN="$(openssl rand -base64 32)"
export PORT=3000

# Запустите HTTP сервер
npm start
```

Откройте в браузере:
- http://localhost:3000 - информация о сервере (публичный)
- http://localhost:3000/health - health check (публичный)

Для защищенных endpoints используйте curl:
```bash
# SSE endpoint (требует аутентификацию)
curl -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
     http://localhost:3000/sse
```

## Troubleshooting

### Ошибка: "TODOIST_API_TOKEN environment variable is required"

**Решение**: Добавьте переменную окружения `TODOIST_API_TOKEN` в настройках Railway.

### Ошибка: "MCP_AUTH_TOKEN environment variable is required"

**Решение**:
1. Сгенерируйте безопасный токен: `openssl rand -base64 32`
2. Добавьте переменную окружения `MCP_AUTH_TOKEN` в настройках Railway
3. Используйте этот токен в заголовке `Authorization: Bearer YOUR_TOKEN` при подключении

### Ошибка: "401 Unauthorized" или "403 Forbidden"

**Причины:**
- Отсутствует заголовок `Authorization`
- Неверный токен в заголовке
- Токен не совпадает с `MCP_AUTH_TOKEN` в Railway

**Решение:**
```bash
# Проверьте, что токен правильно передается
curl -v -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-app.railway.app/sse

# Проверьте токен в Railway Variables
```

### Health check fails

**Возможные причины:**
1. Сервер не запустился - проверьте логи в Railway
2. Неверный токен Todoist - проверьте переменные окружения
3. Проблемы с сетью - проверьте Railway status

**Проверка:**
```bash
curl https://your-app.railway.app/health
```

### Build fails

**Возможные причины:**
1. TypeScript ошибки - проверьте `npm run build` локально
2. Отсутствующие зависимости - проверьте `package.json`

**Решение:**
```bash
# Локально
npm install
npm run build
npm run lint
npm test
```

### SSE endpoint не работает

**Проверка:**
```bash
curl -N https://your-app.railway.app/sse
```

Должен установиться SSE connection.

## Дополнительные ресурсы

- [Railway Documentation](https://docs.railway.app)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Todoist API Documentation](https://developer.todoist.com)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

## Поддержка

Если у вас возникли проблемы с развертыванием на Railway:

1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте health check endpoint
4. Создайте issue на [GitHub](https://github.com/greirson/mcp-todoist/issues)

## Различия между режимами

| Характеристика | Stdio (локальный) | HTTP/SSE (Railway) |
|----------------|-------------------|---------------------|
| Transport | stdin/stdout | HTTP/SSE |
| Использование | Claude Desktop | MCP клиенты через HTTP |
| Endpoint | - | https://your-app.railway.app |
| Health Check | Нет | /health endpoint |
| Масштабируемость | Один процесс | Множество клиентов |
| Развертывание | Локально | Cloud (Railway) |

## Следующие шаги

После успешного развертывания:

1. Настройте мониторинг и алерты в Railway
2. Подключите кастомный домен (опционально)
3. Настройте автоматическое развертывание при push в main ветку
4. Рассмотрите возможность добавления rate limiting для production
5. Настройте логирование и аналитику
