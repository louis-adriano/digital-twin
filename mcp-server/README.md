# Digital Twin MCP Server

A Model Context Protocol (MCP) server that provides Claude Desktop with direct access to professional digital twin data, enabling intelligent search and interaction with experience, skills, projects, and contact information.

## 🚀 Features

### Professional Search Tools
- **Semantic Search**: AI-powered search across all professional data
- **Experience Search**: Filter work experiences by company, role, technology, or date
- **Skills Search**: Find skills by category, proficiency level, or experience years
- **Project Search**: Locate projects by technology, status, or features

### Contact & Availability Tools  
- **Contact Information**: Retrieve professional contact details and social links
- **Availability Status**: Get current availability for different opportunity types
- **Contact Preferences**: Understand preferred communication methods
- **Introduction Templates**: Generate professional introduction emails

### Context Enrichment Tools
- **Complete Profile**: Comprehensive professional profile with all details
- **Career Progression**: Analyze career growth and trajectory
- **Technical Expertise**: Detailed technical skills breakdown
- **Professional Summary**: Generate audience-specific summaries

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database with professional data
- Upstash Vector database for semantic search
- Claude Desktop application

## 🛠️ Installation

1. **Navigate to the MCP server directory:**
   ```bash
   cd mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp ../.env.example .env.local
   # Edit .env.local with your database credentials
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with:

```bash
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Upstash Vector Database  
UPSTASH_VECTOR_REST_URL="https://your-vector-db.upstash.io"
UPSTASH_VECTOR_REST_TOKEN="your_upstash_token"
```

### Claude Desktop Integration

1. **Locate Claude Desktop config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

2. **Build the MCP server to JavaScript:**
   ```bash
   npx tsx build.ts
   ```

3. **Add the MCP server configuration:**
   ```json
   {
     "mcpServers": {
       "digital-twin-professional": {
         "command": "node",
         "args": [
           "/absolute/path/to/your/digital-twin/mcp-server/dist/index.js"
         ],
         "env": {
           "DATABASE_URL": "your_postgresql_connection_string",
           "UPSTASH_VECTOR_REST_URL": "your_upstash_vector_url", 
           "UPSTASH_VECTOR_REST_TOKEN": "your_upstash_vector_token"
         }
       }
     }
   }
   ```

3. **Update the path** in the configuration to match your actual installation directory.

## 🧪 Testing

### Test the MCP server:
```bash
npm test
```

### Manual testing:
```bash
npm run start
```

### Development mode with auto-reload:
```bash
npm run dev
```

## 📖 Usage Examples

Once integrated with Claude Desktop, you can use natural language queries like:

### Search Examples
- *"Find my React experience"*
- *"What are my advanced skills?"* 
- *"Show me completed projects"*
- *"Search for full-stack development experience"*

### Contact Examples  
- *"What's my contact information?"*
- *"Am I available for full-time opportunities?"*
- *"Generate an introduction email for a startup role"*

### Context Examples
- *"Show my complete professional profile"*
- *"Analyze my career progression"*
- *"Create a technical summary for recruiters"*

## 🛠️ Available Tools

### Search Tools
| Tool | Description | Parameters |
|------|-------------|------------|
| `semantic_search_professional` | AI-powered search across all data | `query`, `limit`, `min_score` |
| `search_experiences` | Filter work experiences | `query`, `company`, `position`, `technology` |  
| `search_skills` | Find skills by criteria | `query`, `category`, `min_proficiency` |
| `search_projects` | Locate projects | `query`, `technology`, `status` |

### Contact Tools
| Tool | Description | Parameters |
|------|-------------|------------|
| `get_contact_info` | Retrieve contact details | `include_personal` |
| `get_availability_status` | Check availability | `opportunity_type` |
| `get_preferred_contact_method` | Get contact preferences | `inquiry_type` |
| `generate_introduction_email` | Create intro email | `context`, `company_name`, `role_title` |

### Context Tools  
| Tool | Description | Parameters |
|------|-------------|------------|
| `get_complete_profile` | Full professional profile | `include_details`, `section_filter` |
| `get_career_progression` | Career growth analysis | `focus` |
| `generate_professional_summary` | Audience-specific summary | `audience`, `focus_area`, `length` |

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify `DATABASE_URL` in environment variables
   - Ensure PostgreSQL is running and accessible
   - Check firewall and network settings

2. **Vector Search Not Working**
   - Confirm Upstash Vector credentials
   - Verify vector database has embedded content  
   - Check network connectivity to Upstash

3. **Claude Desktop Not Detecting Server**
   - Verify absolute path in configuration
   - Ensure Node.js and tsx are installed globally
   - Check Claude Desktop logs for errors
   - Restart Claude Desktop after config changes

4. **Tools Not Responding**
   - Check server logs for errors
   - Verify database has professional data
   - Test individual tools using the test client

### Debug Mode

Run with debug logging:
```bash
DEBUG=mcp:* npm run start
```

### Logs

Server logs are output to stderr and can be viewed in Claude Desktop's developer console.

## 🔒 Security Considerations

- Environment variables contain sensitive database credentials
- MCP server runs locally and doesn't expose network ports
- Database queries use parameterized statements to prevent SQL injection
- Contact information visibility can be controlled via tool parameters

## 📝 Development

### Project Structure
```
mcp-server/
├── index.ts              # Main server file
├── tools/
│   ├── search-tools.ts    # Professional search functionality  
│   ├── contact-tools.ts   # Contact and availability tools
│   └── context-tools.ts   # Context enrichment tools
├── test-client.ts         # Test utilities
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Adding New Tools

1. Create tool definition with input schema
2. Implement handler function  
3. Register in main server file
4. Add tests in test client
5. Update documentation

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting guide above
- Review Claude Desktop MCP documentation
- Create an issue in the repository