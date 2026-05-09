import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.net.URL;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class AppLauncher extends JFrame {

    // ============================================================
    // GLOBAL STATE
    // ============================================================
    private File projectsRoot;
    private File currentProjectDir;          // folder for selected project
    private ElementsModel elementsModel;     // in-memory elements.json

    private CardLayout rootLayout;
    private JPanel rootPanel;

    private JTextArea console;

    // ============================================================
    // ELEMENT TYPES
    // ============================================================
    private enum ElementType {
        BADWORD, ENTITY, WORLD
    }

    private static class ElementEntry {
        String id;        // unique id or name
        ElementType type;

        ElementEntry(String id, ElementType type) {
            this.id = id;
            this.type = type;
        }

        @Override
        public String toString() {
            return "[" + type + "] " + id;
        }
    }

    private static class ElementsModel {
        List<ElementEntry> entries = new ArrayList<>();
    }

    // ============================================================
    // CONSTRUCTOR
    // ============================================================
    public AppLauncher() {
        super("Circus Workspace");

        projectsRoot = new File(System.getProperty("user.home"), "CircusProjects");
        projectsRoot.mkdirs();

        elementsModel = new ElementsModel();

        initUI();          // build UI first
        setVisible(true);  // then show window
    }

    // ============================================================
    // UI SETUP
    // ============================================================
    private void initUI() {
        setSize(1150, 720);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        rootLayout = new CardLayout();
        rootPanel = new JPanel(rootLayout);

        rootPanel.add(buildProjectSelectorPanel(), "projects");
        rootPanel.add(buildEditorPanel(), "editor");

        console = new JTextArea();
        console.setEditable(false);
        console.setFont(new Font("Consolas", Font.PLAIN, 13));
        JScrollPane consoleScroll = new JScrollPane(console);
        consoleScroll.setPreferredSize(new Dimension(1150, 140));

        setLayout(new BorderLayout());
        add(rootPanel, BorderLayout.CENTER);
        add(consoleScroll, BorderLayout.SOUTH);

        // make sure first screen shows
        rootLayout.show(rootPanel, "projects");
        rootPanel.revalidate();
        rootPanel.repaint();
        this.revalidate();
        this.repaint();
    }

    // ============================================================
    // PROJECT SELECTOR PANEL
    // ============================================================
    private JPanel buildProjectSelectorPanel() {
        JPanel panel = new JPanel(new BorderLayout());

        DefaultListModel<File> model = new DefaultListModel<>();
        JList<File> list = new JList<>(model);
        list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        list.setCellRenderer((jList, value, index, isSelected, cellHasFocus) -> {
            JLabel lbl = new JLabel(value.getName());
            lbl.setOpaque(true);
            lbl.setBackground(isSelected ? Color.DARK_GRAY : Color.BLACK);
            lbl.setForeground(Color.WHITE);
            lbl.setBorder(BorderFactory.createEmptyBorder(4, 8, 4, 8));
            return lbl;
        });

        refreshProjectList(model);

        JButton createBtn = new JButton("Create Project");
        JButton deleteBtn = new JButton("Delete Project");
        JButton openBtn = new JButton("Open Project");

        createBtn.addActionListener(e -> {
            String name = JOptionPane.showInputDialog(panel, "New project name:");
            if (name == null || name.isBlank()) return;
            File proj = new File(projectsRoot, name.trim());
            if (proj.exists()) {
                append("Project already exists.\n");
                return;
            }
            proj.mkdirs();
            new File(proj, "elements.json").delete(); // fresh
            model.addElement(proj);
            append("Created project: " + proj.getAbsolutePath() + "\n");
        });

        deleteBtn.addActionListener(e -> {
            File sel = list.getSelectedValue();
            if (sel == null) return;
            int res = JOptionPane.showConfirmDialog(panel,
                    "Delete project '" + sel.getName() + "'?\nThis cannot be undone.",
                    "Confirm Delete", JOptionPane.YES_NO_OPTION);
            if (res == JOptionPane.YES_OPTION) {
                deleteRecursive(sel);
                model.removeElement(sel);
                append("Deleted project: " + sel.getAbsolutePath() + "\n");
            }
        });

        openBtn.addActionListener(e -> {
            File sel = list.getSelectedValue();
            if (sel == null) return;
            currentProjectDir = sel;
            append("Opened project: " + currentProjectDir.getAbsolutePath() + "\n");
            try {
                ensureGameInstalled(currentProjectDir);
            } catch (Exception ex) {
                append("ERROR installing game: " + ex.getMessage() + "\n");
            }
            loadElementsJson();
            rootLayout.show(rootPanel, "editor");
            rootPanel.revalidate();
            rootPanel.repaint();
        });

        JPanel buttons = new JPanel();
        buttons.add(createBtn);
        buttons.add(deleteBtn);
        buttons.add(openBtn);

        panel.add(new JScrollPane(list), BorderLayout.CENTER);
        panel.add(buttons, BorderLayout.SOUTH);

        return panel;
    }

    private void refreshProjectList(DefaultListModel<File> model) {
        model.clear();
        File[] dirs = projectsRoot.listFiles(File::isDirectory);
        if (dirs != null) {
            for (File d : dirs) model.addElement(d);
        }
    }

    private void deleteRecursive(File f) {
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) {
                for (File k : kids) deleteRecursive(k);
            }
        }
        f.delete();
    }

    // ============================================================
    // EDITOR PANEL (TABS) – uses currentProjectDir
    // ============================================================
    private JPanel buildEditorPanel() {
        JPanel panel = new JPanel(new BorderLayout());

        JTabbedPane tabs = new JTabbedPane();

        tabs.addTab("Elements", buildElementsTab());
        tabs.addTab("Build / Run", buildBuildRunTab());

        panel.add(tabs, BorderLayout.CENTER);

        JButton backBtn = new JButton("Back to Projects");
        backBtn.addActionListener(e -> {
            currentProjectDir = null;
            elementsModel = new ElementsModel();
            rootLayout.show(rootPanel, "projects");
            rootPanel.revalidate();
            rootPanel.repaint();
        });

        JPanel top = new JPanel(new BorderLayout());
        top.add(backBtn, BorderLayout.WEST);
        panel.add(top, BorderLayout.NORTH);

        return panel;
    }

    // ============================================================
    // ELEMENTS TAB – list + editor area
    // ============================================================
    private JPanel buildElementsTab() {
        JPanel panel = new JPanel(new BorderLayout());

        DefaultListModel<ElementEntry> model = new DefaultListModel<>();
        JList<ElementEntry> list = new JList<>(model);
        list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        list.setCellRenderer((jList, value, index, isSelected, cellHasFocus) -> {
            JLabel lbl = new JLabel(value.toString());
            lbl.setOpaque(true);
            lbl.setBackground(isSelected ? new Color(40, 40, 40) : Color.BLACK);
            lbl.setForeground(Color.WHITE);
            lbl.setBorder(BorderFactory.createEmptyBorder(3, 6, 3, 6));
            return lbl;
        });

        JPanel editorHolder = new JPanel(new CardLayout());
        JPanel emptyEditor = new JPanel();
        emptyEditor.add(new JLabel("Select or create an element to edit."));
        editorHolder.add(emptyEditor, "empty");

        JPanel badwordEditor = buildBadwordEditor();
        JPanel entityEditor = buildEntityEditor();
        JPanel worldEditor = buildWorldEditor();

        editorHolder.add(badwordEditor, "BADWORD");
        editorHolder.add(entityEditor, "ENTITY");
        editorHolder.add(worldEditor, "WORLD");

        CardLayout editorLayout = (CardLayout) editorHolder.getLayout();

        JButton addBtn = new JButton("Add Element");
        JButton delBtn = new JButton("Delete Element");
        JButton commitBtn = new JButton("Commit Elements List");

        addBtn.addActionListener(e -> {
            String[] options = {"Badword Filter", "Entity", "World"};
            int choice = JOptionPane.showOptionDialog(panel,
                    "What type of element do you want to add?",
                    "New Element",
                    JOptionPane.DEFAULT_OPTION,
                    JOptionPane.QUESTION_MESSAGE,
                    null,
                    options,
                    options[0]);
            if (choice == -1) return;

            ElementType type;
            if (choice == 0) type = ElementType.BADWORD;
            else if (choice == 1) type = ElementType.ENTITY;
            else type = ElementType.WORLD;

            String id = JOptionPane.showInputDialog(panel, "Element name/id:");
            if (id == null || id.isBlank()) return;
            id = id.trim();

            ElementEntry entry = new ElementEntry(id, type);
            elementsModel.entries.add(entry);
            model.addElement(entry);
            list.setSelectedValue(entry, true);
        });

        delBtn.addActionListener(e -> {
            ElementEntry sel = list.getSelectedValue();
            if (sel == null) return;
            int res = JOptionPane.showConfirmDialog(panel,
                    "Delete element '" + sel.id + "'?",
                    "Confirm Delete", JOptionPane.YES_NO_OPTION);
            if (res == JOptionPane.YES_OPTION) {
                elementsModel.entries.remove(sel);
                model.removeElement(sel);
                editorLayout.show(editorHolder, "empty");
            }
        });

        commitBtn.addActionListener(e -> {
            if (currentProjectDir == null) {
                append("No project selected.\n");
                return;
            }
            try {
                saveElementsJson();
                append("elements.json saved.\n");
            } catch (Exception ex) {
                append("ERROR saving elements.json: " + ex.getMessage() + "\n");
            }
        });

        list.addListSelectionListener(e -> {
            if (e.getValueIsAdjusting()) return;
            ElementEntry sel = list.getSelectedValue();
            if (sel == null) {
                editorLayout.show(editorHolder, "empty");
                return;
            }
            editorLayout.show(editorHolder, sel.type.name());
        });

        panel.addComponentListener(new ComponentAdapter() {
            @Override
            public void componentShown(ComponentEvent e) {
                model.clear();
                for (ElementEntry entry : elementsModel.entries) {
                    model.addElement(entry);
                }
            }
        });

        JPanel left = new JPanel(new BorderLayout());
        left.add(new JScrollPane(list), BorderLayout.CENTER);

        JPanel leftButtons = new JPanel();
        leftButtons.add(addBtn);
        leftButtons.add(delBtn);
        leftButtons.add(commitBtn);
        left.add(leftButtons, BorderLayout.SOUTH);

        panel.add(left, BorderLayout.WEST);
        panel.add(editorHolder, BorderLayout.CENTER);

        return panel;
    }

    // ============================================================
    // BADWORD EDITOR (AI)
    // ============================================================
    private DefaultListModel<String> badwordModel;

    private JPanel buildBadwordEditor() {
        JPanel panel = new JPanel(new BorderLayout());

        badwordModel = new DefaultListModel<>();
        JList<String> list = new JList<>(badwordModel);
        list.setFont(new Font("Consolas", Font.PLAIN, 14));

        JButton addBtn = new JButton("Add Word");
        JButton delBtn = new JButton("Delete Word");
        JButton injectBtn = new JButton("Inject into CircusBrain.java");

        addBtn.addActionListener(e -> {
            String w = JOptionPane.showInputDialog(panel, "New blacklist word:");
            if (w != null && !w.isBlank()) badwordModel.addElement(w.trim());
        });

        delBtn.addActionListener(e -> {
            int idx = list.getSelectedIndex();
            if (idx >= 0) badwordModel.remove(idx);
        });

        injectBtn.addActionListener(e -> {
            if (currentProjectDir == null) {
                append("No project selected.\n");
                return;
            }
            try {
                injectBlacklistIntoCircusBrain(currentProjectDir, badwordModel);
                append("Blacklist injected into CircusBrain.java\n");
            } catch (Exception ex) {
                append("ERROR: " + ex.getMessage() + "\n");
            }
        });

        JPanel buttons = new JPanel();
        buttons.add(addBtn);
        buttons.add(delBtn);
        buttons.add(injectBtn);

        panel.add(new JScrollPane(list), BorderLayout.CENTER);
        panel.add(buttons, BorderLayout.SOUTH);

        return panel;
    }

    // ============================================================
    // ENTITY EDITOR – single entity template + injector
    // ============================================================
    private JTextField entityNameField;
    private JTextField entitySpawnXField;
    private JTextField entitySpawnZField;
    private Color entityColor = Color.RED;

    private JPanel buildEntityEditor() {
        JPanel panel = new JPanel(new BorderLayout());

        JPanel controls = new JPanel(new GridBagLayout());
        GridBagConstraints gc = new GridBagConstraints();
        gc.insets = new Insets(4, 4, 4, 4);
        gc.fill = GridBagConstraints.HORIZONTAL;
        gc.weightx = 1.0;

        entityNameField = new JTextField();
        entitySpawnXField = new JTextField("0");
        entitySpawnZField = new JTextField("1000");

        JButton pickColor = new JButton("Pick Entity Color");
        pickColor.addActionListener(e -> {
            Color c = JColorChooser.showDialog(panel, "Entity Color", entityColor);
            if (c != null) entityColor = c;
        });

        gc.gridx = 0; gc.gridy = 0;
        controls.add(new JLabel("Entity Class Name:"), gc);
        gc.gridy++;
        controls.add(entityNameField, gc);

        gc.gridy++;
        controls.add(new JLabel("Spawn X:"), gc);
        gc.gridy++;
        controls.add(entitySpawnXField, gc);

        gc.gridy++;
        controls.add(new JLabel("Spawn Z:"), gc);
        gc.gridy++;
        controls.add(entitySpawnZField, gc);

        gc.gridy++;
        controls.add(pickColor, gc);

        JButton commitBtn = new JButton("Create / Inject Entity");
        gc.gridy++;
        controls.add(commitBtn, gc);

        EntityPreviewPanel preview = new EntityPreviewPanel();

        Timer t = new Timer(50, e -> {
            preview.setEntityColor(entityColor);
            preview.setEntityName(entityNameField.getText().trim());
            preview.repaint();
        });
        t.start();

        commitBtn.addActionListener(e -> {
            if (currentProjectDir == null) {
                append("No project selected.\n");
                return;
            }
            String name = entityNameField.getText().trim();
            if (name.isEmpty()) {
                append("Entity name cannot be empty.\n");
                return;
            }
            double x, z;
            try {
                x = Double.parseDouble(entitySpawnXField.getText().trim());
                z = Double.parseDouble(entitySpawnZField.getText().trim());
            } catch (NumberFormatException ex) {
                append("Invalid spawn coordinates.\n");
                return;
            }
            try {
                String colorHex = toHex(entityColor);
                createEntityFile(currentProjectDir, name, colorHex);
                patchEngineForEntity(currentProjectDir, name, x, z);
                append("Entity '" + name + "' created and injected.\n");
            } catch (Exception ex) {
                append("ERROR: " + ex.getMessage() + "\n");
            }
        });

        panel.add(controls, BorderLayout.WEST);
        panel.add(preview, BorderLayout.CENTER);

        return panel;
    }

    private static class EntityPreviewPanel extends JPanel {
        private Color entityColor = Color.RED;
        private String entityName = "";

        public void setEntityColor(Color c) { this.entityColor = c; }
        public void setEntityName(String n) { this.entityName = n; }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g;
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            int w = getWidth();
            int h = getHeight();

            g2.setColor(Color.DARK_GRAY);
            g2.fillRect(0, 0, w, h);

            int r = Math.min(w, h) / 3;
            int cx = w / 2;
            int cy = h / 2;

            g2.setColor(entityColor);
            g2.fillOval(cx - r, cy - r, r * 2, r * 2);

            g2.setColor(Color.WHITE);
            if (!entityName.isEmpty()) {
                FontMetrics fm = g2.getFontMetrics();
                int tw = fm.stringWidth(entityName);
                g2.drawString(entityName, cx - tw / 2, cy - r - 10);
            }
        }
    }

    private void createEntityFile(File projectDir, String name, String colorHex) throws Exception {
        File entDir = new File(projectDir, "game/src/com/circus/entities");
        entDir.mkdirs();

        File entFile = new File(entDir, name + ".java");

        String code =
                "package com.circus.entities;\n" +
                "import java.awt.Color;\n" +
                "import java.util.ArrayList;\n\n" +
                "public class " + name + " extends Entity {\n" +
                "    public " + name + "(String name, double x, double z) {\n" +
                "        super(name, Color.decode(\"" + colorHex + "\"), x, z);\n" +
                "    }\n\n" +
                "    @Override\n" +
                "    public void think(ArrayList<Entity> allEntities) {\n" +
                "        super.think(allEntities);\n" +
                "    }\n" +
                "}\n";

        Files.write(entFile.toPath(), code.getBytes());
    }

    private void patchEngineForEntity(File projectDir, String entityName, double x, double z) throws Exception {
        File engineFile = new File(projectDir, "game/src/com/circus/main/Engine.java");
        if (!engineFile.exists()) throw new RuntimeException("Engine.java not found.");

        List<String> lines = Files.readAllLines(engineFile.toPath());
        List<String> out = new ArrayList<>();

        String importLine = "import com.circus.entities." + entityName + ";";
        boolean importExists = lines.stream().anyMatch(l -> l.contains(importLine));
        boolean addedImport = false;
        boolean addedSpawn = false;

        for (int i = 0; i < lines.size(); i++) {
            String raw = lines.get(i);
            String line = raw.trim();

            if (!addedImport && line.startsWith("import com.circus.entities.") && !importExists) {
                out.add(raw);
                out.add(importLine);
                addedImport = true;
                continue;
            }
            if (!addedImport && line.startsWith("import com.circus.world.")) {
                if (!importExists) out.add(importLine);
                out.add(raw);
                addedImport = true;
                continue;
            }

            if (!addedSpawn && line.contains("// INITIALIZE THE ACTORS")) {
                out.add(raw);
                i++;
                for (; i < lines.size(); i++) {
                    String l = lines.get(i);
                    out.add(l);
                    if (!l.trim().startsWith("entities.add(")) {
                        String spawnLine = "        entities.add(new " + entityName + "(\"" + entityName.toUpperCase() + "\", " + x + ", " + z + "));";
                        boolean exists = lines.stream().anyMatch(s -> s.contains("new " + entityName + "("));
                        if (!exists) out.add(spawnLine);
                        addedSpawn = true;
                        break;
                    }
                }
                continue;
            }

            out.add(raw);
        }

        Files.write(engineFile.toPath(), out);
    }

    // ============================================================
    // WORLD EDITOR – with preview
    // ============================================================
    private JTextField worldNameField;
    private Color worldSkyTop = new Color(0x0F0019);
    private Color worldSkyBottom = new Color(0x28003C);
    private Color worldGround = new Color(0x444444);
    private JCheckBox worldBleachers;
    private JCheckBox worldShowEntities;

    private JPanel buildWorldEditor() {
        JPanel panel = new JPanel(new BorderLayout());

        JPanel controls = new JPanel(new GridBagLayout());
        GridBagConstraints gc = new GridBagConstraints();
        gc.insets = new Insets(4, 4, 4, 4);
        gc.fill = GridBagConstraints.HORIZONTAL;
        gc.weightx = 1.0;

        worldNameField = new JTextField();
        worldBleachers = new JCheckBox("Include Bleachers", true);
        worldShowEntities = new JCheckBox("Show Entities (preview only)", true);

        JButton pickSkyTop = new JButton("Pick Sky Top Color");
        pickSkyTop.addActionListener(e -> {
            Color c = JColorChooser.showDialog(panel, "Sky Top Color", worldSkyTop);
            if (c != null) worldSkyTop = c;
        });

        JButton pickSkyBottom = new JButton("Pick Sky Bottom Color");
        pickSkyBottom.addActionListener(e -> {
            Color c = JColorChooser.showDialog(panel, "Sky Bottom Color", worldSkyBottom);
            if (c != null) worldSkyBottom = c;
        });

        JButton pickGround = new JButton("Pick Ground Color");
        pickGround.addActionListener(e -> {
            Color c = JColorChooser.showDialog(panel, "Ground Color", worldGround);
            if (c != null) worldGround = c;
        });

        gc.gridx = 0; gc.gridy = 0;
        controls.add(new JLabel("World Class Name:"), gc);
        gc.gridy++;
        controls.add(worldNameField, gc);

        gc.gridy++;
        controls.add(pickSkyTop, gc);
        gc.gridy++;
        controls.add(pickSkyBottom, gc);
        gc.gridy++;
        controls.add(pickGround, gc);

        gc.gridy++;
        controls.add(worldBleachers, gc);
        gc.gridy++;
        controls.add(worldShowEntities, gc);

        JButton commitBtn = new JButton("Create / Update World");
        gc.gridy++;
        controls.add(commitBtn, gc);

        WorldPreviewPanel preview = new WorldPreviewPanel();
        Timer t = new Timer(50, e -> {
            preview.setSkyColors(worldSkyTop, worldSkyBottom);
            preview.setGroundColor(worldGround);
            preview.setBleachers(worldBleachers.isSelected());
            preview.setShowEntities(worldShowEntities.isSelected());
            preview.repaint();
        });
        t.start();

        commitBtn.addActionListener(e -> {
            if (currentProjectDir == null) {
                append("No project selected.\n");
                return;
            }
            String name = worldNameField.getText().trim();
            if (name.isEmpty()) {
                append("World name cannot be empty.\n");
                return;
            }
            try {
                String skyTopHex = toHex(worldSkyTop);
                String skyBottomHex = toHex(worldSkyBottom);
                String groundHex = toHex(worldGround);
                createWorldFile(currentProjectDir, name, skyTopHex, skyBottomHex,
                        worldBleachers.isSelected(), worldShowEntities.isSelected(), groundHex);
                patchEngineForWorld(currentProjectDir, name);
                append("World '" + name + "' created/updated and Engine patched.\n");
            } catch (Exception ex) {
                append("ERROR: " + ex.getMessage() + "\n");
            }
        });

        panel.add(controls, BorderLayout.WEST);
        panel.add(preview, BorderLayout.CENTER);

        return panel;
    }

    private static class WorldPreviewPanel extends JPanel implements KeyListener, MouseMotionListener, MouseListener {
        private Color skyTop = new Color(0x0F0019);
        private Color skyBottom = new Color(0x28003C);
        private Color groundColor = new Color(0x444444);
        private boolean bleachers = true;
        private boolean showEntities = true;

        private double camX = 0;
        private double camZ = -500;
        private double yaw = 0;

        private boolean mouseLocked = false;
        private Point lastMouse;

        public WorldPreviewPanel() {
            setFocusable(true);
            addKeyListener(this);
            addMouseMotionListener(this);
            addMouseListener(this);

            new Thread(() -> {
                while (true) {
                    repaint();
                    try { Thread.sleep(16); } catch (Exception ignored) {}
                }
            }).start();
        }

        public void setSkyColors(Color top, Color bottom) { this.skyTop = top; this.skyBottom = bottom; }
        public void setGroundColor(Color c) { this.groundColor = c; }
        public void setBleachers(boolean b) { this.bleachers = b; }
        public void setShowEntities(boolean b) { this.showEntities = b; }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g;
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            int w = getWidth();
            int h = getHeight();
            int cx = w / 2;
            int cy = h / 2;

            g2.setPaint(new GradientPaint(0, 0, skyTop, 0, cy, skyBottom));
            g2.fillRect(0, 0, w, h);

            if (bleachers) {
                for (int z = 0; z <= 5000; z += 250) {
                    for (int x = -2500; x <= 2500; x += 250) {
                        double dx = x - camX;
                        double dz = z - camZ;
                        double rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
                        double rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
                        if (rz < 50) continue;
                        int px = (int)((rx / rz) * 800) + cx;
                        int py = (int)((400 / rz) * 800) + cy;
                        int size = (int)(15000 / rz);
                        g2.setColor(groundColor.darker());
                        g2.fillRect(px - size/2, py, size, size/4);
                    }
                }
            } else {
                g2.setColor(groundColor);
                g2.fillRect(0, cy, w, cy);
            }

            if (showEntities) {
                g2.setColor(Color.WHITE);
                for (int i = -2; i <= 2; i++) {
                    double ex = i * 300;
                    double ez = 1000;
                    double dx = ex - camX;
                    double dz = ez - camZ;
                    double rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
                    double rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
                    if (rz < 50) continue;
                    int px = (int)((rx / rz) * 800) + cx;
                    int py = (int)((200 / rz) * 800) + cy;
                    int s = (int)(8000 / rz);
                    g2.fillOval(px - s/2, py - s/2, s, s);
                }
            }
        }

        @Override public void keyPressed(KeyEvent e) {
            double s = 50;
            if (e.getKeyCode() == KeyEvent.VK_W) { camX += Math.sin(yaw) * s; camZ += Math.cos(yaw) * s; }
            if (e.getKeyCode() == KeyEvent.VK_S) { camX -= Math.sin(yaw) * s; camZ -= Math.cos(yaw) * s; }
            if (e.getKeyCode() == KeyEvent.VK_A) { camX -= Math.cos(yaw) * s; camZ += Math.sin(yaw) * s; }
            if (e.getKeyCode() == KeyEvent.VK_D) { camX += Math.cos(yaw) * s; camZ -= Math.sin(yaw) * s; }
        }
        @Override public void keyReleased(KeyEvent e) {}
        @Override public void keyTyped(KeyEvent e) {}
        @Override public void mouseDragged(MouseEvent e) {
            if (mouseLocked && lastMouse != null) {
                int dx = e.getX() - lastMouse.x;
                yaw += dx * 0.003;
                lastMouse = e.getPoint();
            }
        }
        @Override public void mouseMoved(MouseEvent e) { if (!mouseLocked) lastMouse = e.getPoint(); }
        @Override public void mousePressed(MouseEvent e) { requestFocusInWindow(); mouseLocked = true; lastMouse = e.getPoint(); }
        @Override public void mouseClicked(MouseEvent e) {}
        @Override public void mouseReleased(MouseEvent e) { mouseLocked = false; }
        @Override public void mouseEntered(MouseEvent e) {}
        @Override public void mouseExited(MouseEvent e) {}
    }

    private void createWorldFile(File projectDir, String name, String skyTop, String skyBottom,
                                 boolean bleachers, boolean showEntities, String groundColor) throws Exception {
        File worldDir = new File(projectDir, "game/src/com/circus/world");
        worldDir.mkdirs();
        File newWorld = new File(worldDir, name + ".java");

        String code =
                "package com.circus.world;\n\n" +
                "import com.circus.main.ShaderHandler;\n" +
                "import java.awt.*;\n\n" +
                "public class " + name + " extends CircusGrounds {\n\n" +
                "    @Override\n" +
                "    public void render(Graphics2D g2, int width, int height,\n" +
                "                       double camX, double camZ, double yaw) {\n\n" +
                "        int cx = width / 2;\n" +
                "        int cy = height / 2;\n\n" +
                "        g2.setPaint(new GradientPaint(\n" +
                "                0, 0, Color.decode(\"" + skyTop + "\"),\n" +
                "                0, cy, Color.decode(\"" + skyBottom + "\")\n" +
                "        ));\n" +
                "        g2.fillRect(0, 0, width, height);\n\n";

        if (bleachers) {
            code +=
                    "        for (int z = 0; z <= 5000; z += 250) {\n" +
                    "            for (int x = -2500; x <= 2500; x += 250) {\n" +
                    "                double dx = x - camX;\n" +
                    "                double dz = z - camZ;\n" +
                    "                double rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);\n" +
                    "                double rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);\n" +
                    "                if (rz < 50) continue;\n" +
                    "                int px = (int)((rx / rz) * 800) + cx;\n" +
                    "                int py = (int)((400 / rz) * 800) + cy;\n" +
                    "                int size = (int)(15000 / rz);\n" +
                    "                Color base = Color.decode(\"" + groundColor + "\");\n" +
                    "                Color shaded = ShaderHandler.applyShading(base, rz, 0.8);\n" +
                    "                g2.setColor(shaded);\n" +
                    "                g2.fillRect(px - size/2, py, size, size/4);\n" +
                    "            }\n" +
                    "        }\n\n";
        } else {
            code +=
                    "        g2.setColor(Color.decode(\"" + groundColor + "\"));\n" +
                    "        g2.fillRect(0, cy, width, cy);\n\n";
        }

        code += "    }\n}\n";

        Files.write(newWorld.toPath(), code.getBytes());
    }

    private void patchEngineForWorld(File projectDir, String worldName) throws Exception {
        File engineFile = new File(projectDir, "game/src/com/circus/main/Engine.java");
        if (!engineFile.exists()) throw new RuntimeException("Engine.java not found.");

        List<String> lines = Files.readAllLines(engineFile.toPath());
        List<String> out = new ArrayList<>();

        boolean hasActiveWorldField = false;
        boolean addedWorldInstance = false;
        boolean addedImport = false;
        boolean patchedRender = false;
        boolean addedKeybind = false;

        int nextKey = findNextWorldKey(lines);
        String keyConst = "VK_" + nextKey;

        for (int i = 0; i < lines.size(); i++) {
            String raw = lines.get(i);
            String line = raw.trim();

            if (!addedImport && line.startsWith("import com.circus.world.")) {
                out.add(raw);
                boolean already = false;
                for (String l : lines) {
                    if (l.contains("import com.circus.world." + worldName + ";")) {
                        already = true;
                        break;
                    }
                }
                if (!already) out.add("import com.circus.world." + worldName + ";");
                addedImport = true;
                continue;
            }
            if (!addedImport && line.startsWith("import com.circus.menus.")) {
                out.add("import com.circus.world." + worldName + ";");
                out.add(raw);
                addedImport = true;
                continue;
            }

            if (!hasActiveWorldField && line.contains("private Torture nightmare")) {
                out.add(raw);
                boolean exists = false;
                for (String l : lines) {
                    if (l.contains("private CircusGrounds activeWorld")) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) out.add("    private CircusGrounds activeWorld = null;");
                hasActiveWorldField = true;
                continue;
            }

            if (!addedWorldInstance && line.contains("private CircusGrounds grounds")) {
                out.add(raw);
                String instanceLine = "    private " + worldName + " world_" + worldName + " = new " + worldName + "();";
                boolean exists = false;
                for (String l : lines) {
                    if (l.contains("world_" + worldName + " = new " + worldName + "();")) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) out.add(instanceLine);
                addedWorldInstance = true;
                continue;
            }

            if (!patchedRender && line.startsWith("if (com.circus.ai.CircusBrain.IS_TORTURE_MODE")) {
                out.add("        if (activeWorld != null) {");
                out.add("            activeWorld.render(g2, w, h, camX, camZ, yaw);");
                out.add("        } else if (com.circus.ai.CircusBrain.IS_TORTURE_MODE) {");
                out.add("            nightmare.render(g2, w, h, camX, camZ, yaw);");
                out.add("        } else {");
                out.add("            grounds.render(g2, w, h, camX, camZ, yaw);");
                out.add("        }");
                int braceDepth = 0;
                i++;
                for (; i < lines.size(); i++) {
                    String l = lines.get(i);
                    if (l.contains("{")) braceDepth++;
                    if (l.contains("}")) {
                        if (braceDepth == 0) break;
                        braceDepth--;
                    }
                }
                patchedRender = true;
                continue;
            }

            if (!addedKeybind && line.startsWith("public void keyPressed(KeyEvent e)")) {
                out.add(raw);
                i++;
                if (i < lines.size()) out.add(lines.get(i));
                out.add("        if (e.getKeyCode() == KeyEvent." + keyConst + ") {");
                out.add("            activeWorld = world_" + worldName + ";");
                out.add("            activeMenu = null;");
                out.add("            updateMouseLock();");
                out.add("            return;");
                out.add("        }");
                addedKeybind = true;
                continue;
            }

            out.add(raw);
        }

        Files.write(engineFile.toPath(), out);
    }

    private int findNextWorldKey(List<String> lines) {
        boolean[] used = new boolean[10];
        for (String l : lines) {
            l = l.trim();
            for (int d = 1; d <= 9; d++) {
                if (l.contains("KeyEvent.VK_" + d)) used[d] = true;
            }
        }
        for (int d = 1; d <= 9; d++) if (!used[d]) return d;
        return 9;
    }

    // ============================================================
    // BUILD / RUN TAB (per project)
    // ============================================================
    private JPanel buildBuildRunTab() {
        JPanel p = new JPanel();

        JButton downloadBtn = new JButton("Download & Install Game");
        JButton runBtn = new JButton("Run Project");
        JButton jarBtn = new JButton("Create JAR File");

        downloadBtn.addActionListener(e -> {
            if (currentProjectDir == null) {
                append("No project selected.\n");
                return;
            }
            new Thread(() -> {
                try {
                    ensureGameInstalled(currentProjectDir);
                    append("Game installed for project.\n");
                } catch (Exception ex) {
                    append("ERROR: " + ex.getMessage() + "\n");
                }
            }).start();
        });

        runBtn.addActionListener(e -> {
            if (currentProjectDir == null) {
                append("No project selected.\n");
                return;
            }
            new Thread(() -> {
                try {
                    compileAndRunProject(currentProjectDir);
                } catch (Exception ex) {
                    append("ERROR: " + ex.getMessage() + "\n");
                }
            }).start();
        });

        jarBtn.addActionListener(e -> {
            if (currentProjectDir == null) {
                append("No project selected.\n");
                return;
            }
            createJarFile(currentProjectDir);
        });

        p.add(downloadBtn);
        p.add(runBtn);
        p.add(jarBtn);

        return p;
    }

    private void ensureGameInstalled(File projectDir) throws Exception {
        File gameDir = new File(projectDir, "game");
        if (gameDir.exists() && new File(gameDir, "src").exists()) return;

        append("Downloading base game into project...\n");
        String urlStr = "https://alaricholt677.github.io/MOD/downloads/releases/game.zip";

        Path tempZip = Files.createTempFile("circus_game", ".zip");
        try (InputStream in = new URL(urlStr).openStream()) {
            Files.copy(in, tempZip, StandardCopyOption.REPLACE_EXISTING);
        }

        unzip(tempZip, gameDir.toPath());
        Files.deleteIfExists(tempZip);
    }

    private void compileAndRunProject(File projectDir) throws Exception {
        compileProject(projectDir);
        File outDir = new File(projectDir, "game/runbin");

        ProcessBuilder run = new ProcessBuilder(
                "java",
                "-cp", outDir.getAbsolutePath(),
                "com.circus.main.Main",
                "--name",
                "DEV"
        );
        run.directory(new File(projectDir, "game"));
        run.inheritIO();
        run.start();
    }

    private void compileProject(File projectDir) throws Exception {
        File srcDir = new File(projectDir, "game/src");
        File outDir = new File(projectDir, "game/runbin");
        outDir.mkdirs();

        List<String> javaFiles = new ArrayList<>();
        collectJavaFiles(srcDir, javaFiles);
        if (javaFiles.isEmpty()) throw new RuntimeException("No Java files found.");

        List<String> cmd = new ArrayList<>();
        cmd.add("javac");
        cmd.add("-d");
        cmd.add(outDir.getAbsolutePath());
        cmd.add("-sourcepath");
        cmd.add(srcDir.getAbsolutePath());
        cmd.addAll(javaFiles);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(new File(projectDir, "game"));
        pb.inheritIO();
        Process p = pb.start();
        int code = p.waitFor();
        if (code != 0) throw new RuntimeException("Compilation failed: " + code);
    }

    private void collectJavaFiles(File dir, List<String> list) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.isDirectory()) collectJavaFiles(f, list);
            else if (f.getName().endsWith(".java")) list.add(f.getAbsolutePath());
        }
    }

    private void createJarFile(File projectDir) {
        new Thread(() -> {
            try {
                compileProject(projectDir);

                JFileChooser chooser = new JFileChooser();
                chooser.setDialogTitle("Choose where to save the JAR");
                chooser.setSelectedFile(new File("circus-mod.jar"));
                int result = chooser.showSaveDialog(this);
                if (result != JFileChooser.APPROVE_OPTION) {
                    append("JAR creation cancelled.\n");
                    return;
                }

                File jarFile = chooser.getSelectedFile();
                File gameDir = new File(projectDir, "game");
                File outDir = new File(gameDir, "runbin");
                File assetsDir = new File(gameDir, "assets");
                File libDir = new File(gameDir, "lib");

                File manifest = File.createTempFile("manifest", ".mf");
                try (PrintWriter pw = new PrintWriter(new FileWriter(manifest))) {
                    pw.println("Manifest-Version: 1.0");
                    pw.println("Main-Class: com.circus.main.Main");
                }

                List<String> cmd = new ArrayList<>();
                cmd.add("jar");
                cmd.add("cmf");
                cmd.add(manifest.getAbsolutePath());
                cmd.add(jarFile.getAbsolutePath());
                cmd.add("-C");
                cmd.add(outDir.getAbsolutePath());
                cmd.add(".");

                if (assetsDir.exists()) {
                    cmd.add("-C");
                    cmd.add(assetsDir.getAbsolutePath());
                    cmd.add("assets");
                }
                if (libDir.exists()) {
                    cmd.add("-C");
                    cmd.add(libDir.getAbsolutePath());
                    cmd.add("lib");
                }

                ProcessBuilder pb = new ProcessBuilder(cmd);
                pb.directory(gameDir);
                pb.inheritIO();
                Process p = pb.start();
                int code = p.waitFor();
                if (code != 0) append("ERROR: jar tool failed: " + code + "\n");
                else append("JAR created at: " + jarFile.getAbsolutePath() + "\n");

                manifest.delete();
            } catch (Exception ex) {
                append("ERROR creating JAR: " + ex.getMessage() + "\n");
            }
        }).start();
    }

    // ============================================================
    // ELEMENTS.JSON LOAD/SAVE
    // ============================================================
    private void loadElementsJson() {
        elementsModel = new ElementsModel();
        if (currentProjectDir == null) return;
        File f = new File(currentProjectDir, "elements.json");
        if (!f.exists()) return;
        try {
            List<String> lines = Files.readAllLines(f.toPath());
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] parts = line.split(":", 2);
                if (parts.length != 2) continue;
                ElementType type = ElementType.valueOf(parts[0]);
                String id = parts[1];
                elementsModel.entries.add(new ElementEntry(id, type));
            }
        } catch (Exception e) {
            append("ERROR reading elements.json: " + e.getMessage() + "\n");
        }
    }

    private void saveElementsJson() throws Exception {
        if (currentProjectDir == null) return;
        File f = new File(currentProjectDir, "elements.json");
        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            for (ElementEntry e : elementsModel.entries) {
                pw.println(e.type.name() + ":" + e.id);
            }
        }
    }

    // ============================================================
    // ZIP / UNZIP
    // ============================================================
    private void unzip(Path zipFile, Path destDir) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFile.toFile()))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path newPath = destDir.resolve(entry.getName());
                if (entry.isDirectory()) {
                    Files.createDirectories(newPath);
                } else {
                    Files.createDirectories(newPath.getParent());
                    Files.copy(zis, newPath, StandardCopyOption.REPLACE_EXISTING);
                }
                zis.closeEntry();
            }
        }
    }

    // ============================================================
    // BLACKLIST INJECTION
    // ============================================================
    private void injectBlacklistIntoCircusBrain(File projectDir, DefaultListModel<String> model) throws Exception {
        File brainFile = new File(projectDir, "game/src/com/circus/ai/CircusBrain.java");
        if (!brainFile.exists()) throw new RuntimeException("CircusBrain.java not found.");

        StringBuilder sb = new StringBuilder();
        sb.append("    private static final String[] BLACKLIST = {");
        for (int i = 0; i < model.size(); i++) {
            sb.append("\"").append(model.get(i)).append("\"");
            if (i < model.size() - 1) sb.append(", ");
        }
        sb.append("};");

        String newLine = sb.toString();
        List<String> lines = Files.readAllLines(brainFile.toPath());
        for (int i = 0; i < lines.size(); i++) {
            if (lines.get(i).contains("private static final String[] BLACKLIST")) {
                lines.set(i, newLine);
            }
        }
        Files.write(brainFile.toPath(), lines);
    }

    // ============================================================
    // UTILS
    // ============================================================
    private String toHex(Color c) {
        return String.format("#%02X%02X%02X", c.getRed(), c.getGreen(), c.getBlue());
    }

    // ============================================================
    // CONSOLE
    // ============================================================
    public void append(String text) {
        SwingUtilities.invokeLater(() -> {
            console.append(text);
            console.setCaretPosition(console.getDocument().getLength());
        });
    }

    // ============================================================
    // MAIN
    // ============================================================
    public static void main(String[] args) {
        SwingUtilities.invokeLater(AppLauncher::new);
    }
}
