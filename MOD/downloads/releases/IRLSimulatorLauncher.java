import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.awt.event.*;
import java.io.*;
import java.net.URL;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import javax.imageio.ImageIO;

public class Launcher extends JFrame {

    // --- Config ---
    private static final String DOWNLOAD_URL = "https://alaricholt677.github.io/downloads/irl.zip";
    private static final String JAR_NAME = "IRLSimulator.jar";
    private static final String BUILD_ID = "IRL-Launcher Build r11";

    // --- Data files ---
    private static final String DATA_DIR = "launcher_data";
    private static final String PROFILE_FILE = "profile.dat";
    private static final String INSTALLATIONS_FILE = "installations.dat";
    private static final String SKINS_FILE = "skins.dat";
    private static final String SETTINGS_FILE = "settings.dat";

    // --- Colors ---
    private static final Color BG_DARK = new Color(24, 24, 24);
    private static final Color BG_MAIN = new Color(32, 32, 32);
    private static final Color BG_CARD = new Color(38, 38, 38);
    private static final Color ACCENT = new Color(120, 200, 120);
    private static final Color ACCENT_ALT = new Color(150, 110, 220);
    private static final Color TEXT_PRIMARY = Color.WHITE;
    private static final Color TEXT_SECONDARY = new Color(180, 180, 180);

    // --- State ---
    private String currentUsername = "Grox";
    private boolean isSignedInWithMicrosoft = false;

    private DefaultListModel<Installation> installationModel = new DefaultListModel<>();
    private Installation activeInstallation;
    private JList<Installation> installationList;

    private DefaultListModel<SkinEntry> skinModel = new DefaultListModel<>();
    private SkinEntry activeSkin;
    private JList<SkinEntry> skinList;
    private JLabel skinPreviewLabel;

    private String lastTabKey = "home";
    private String lastPatchNotesVersion = "IRL Simulator 1.1.0 - The Grox Update";

    private JProgressBar progressBar;
    private JLabel statusLabel;
    private JLabel profileNameLabel;
    private JLabel profileTagLabel;

    private CardLayout centerCards;
    private JPanel centerCardContainer;

    private JButton homeSideButton;
    private JButton instSideButton;
    private JButton skinsSideButton;
    private JButton patchSideButton;
    private JButton aboutSideButton;

    private JComboBox<String> patchVersionBox;
    private JTextArea patchNotesArea;

    public Launcher() {
        initDataDir();
        loadProfile();
        loadSettings();
        loadInstallations();
        loadSkins();
        setupUI();
        applyLoadedState();
        addComponentListener(new ComponentAdapter() {
            @Override public void componentResized(ComponentEvent e) {
                saveSettings();
            }
        });
    }

    private void initDataDir() {
        File dir = new File(DATA_DIR);
        if (!dir.exists()) dir.mkdirs();
    }

    // --- UI setup ---
    private void setupUI() {
        setTitle("IRL Simulator Launcher");
        setSize(1150, 700);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());
        getContentPane().setBackground(BG_DARK);

        // --- Left Sidebar ---
        JPanel sidebar = new JPanel();
        sidebar.setPreferredSize(new Dimension(230, 700));
        sidebar.setBackground(BG_DARK);
        sidebar.setLayout(new BorderLayout());

        JPanel logoPanel = new JPanel() {
            @Override protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                GradientPaint gp = new GradientPaint(0, 0, ACCENT_ALT, getWidth(), getHeight(), ACCENT);
                g2.setPaint(gp);
                g2.fillRoundRect(10, 10, getWidth() - 20, getHeight() - 20, 18, 18);

                g2.setColor(new Color(0, 0, 0, 80));
                g2.fillRoundRect(18, 18, getWidth() - 36, getHeight() - 36, 14, 14);

                g2.setColor(Color.WHITE);
                g2.setFont(getFont().deriveFont(Font.BOLD, 18f));
                g2.drawString("IRL SIM", 26, 40);
                g2.setFont(getFont().deriveFont(Font.PLAIN, 11f));
                g2.drawString("Grox Official Launcher", 26, 58);

                g2.dispose();
            }
        };
        logoPanel.setOpaque(false);
        logoPanel.setPreferredSize(new Dimension(230, 90));
        sidebar.add(logoPanel, BorderLayout.NORTH);

        JPanel sideButtons = new JPanel();
        sideButtons.setOpaque(false);
        sideButtons.setLayout(new BoxLayout(sideButtons, BoxLayout.Y_AXIS));
        sideButtons.setBorder(new EmptyBorder(10, 10, 10, 10));

        homeSideButton = createSidebarButton("HOME", true);
        instSideButton = createSidebarButton("INSTALLATIONS", false);
        skinsSideButton = createSidebarButton("SKINS", false);
        patchSideButton = createSidebarButton("PATCH NOTES", false);
        aboutSideButton = createSidebarButton("ABOUT", false);

        sideButtons.add(homeSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(instSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(skinsSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(patchSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(aboutSideButton);

        sidebar.add(sideButtons, BorderLayout.CENTER);

        JPanel buildPanel = new JPanel(new BorderLayout());
        buildPanel.setOpaque(false);
        buildPanel.setBorder(new EmptyBorder(0, 10, 10, 10));

        JLabel buildLabel = new JLabel(BUILD_ID);
        buildLabel.setForeground(TEXT_SECONDARY);
        buildLabel.setFont(new Font("SansSerif", Font.PLAIN, 11));
        buildPanel.add(buildLabel, BorderLayout.WEST);

        profileTagLabel = new JLabel("PROFILE: " + currentUsername.toUpperCase());
        profileTagLabel.setForeground(ACCENT);
        profileTagLabel.setFont(new Font("Monospaced", Font.BOLD, 11));
        buildPanel.add(profileTagLabel, BorderLayout.EAST);

        sidebar.add(buildPanel, BorderLayout.SOUTH);

        add(sidebar, BorderLayout.WEST);

        // --- Right Main Area ---
        JPanel mainArea = new DottedBackgroundPanel();
        mainArea.setLayout(new BorderLayout());
        mainArea.setBorder(new EmptyBorder(10, 10, 10, 10));
        add(mainArea, BorderLayout.CENTER);

        JPanel header = new JPanel() {
            @Override protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                g2.setColor(BG_MAIN);
                g2.fillRect(0, 0, getWidth(), getHeight());

                g2.setColor(new Color(0, 0, 0, 80));
                Polygon p = new Polygon();
                p.addPoint(0, getHeight());
                p.addPoint(getWidth() / 2, 0);
                p.addPoint(getWidth(), 0);
                p.addPoint(getWidth(), getHeight());
                g2.fillPolygon(p);

                g2.dispose();
            }
        };
        header.setPreferredSize(new Dimension(100, 70));
        header.setLayout(new BorderLayout());
        header.setBorder(new EmptyBorder(10, 20, 10, 20));

        JLabel titleLabel = new JLabel("IRL SIMULATOR LAUNCHER");
        titleLabel.setForeground(TEXT_PRIMARY);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 18));

        JLabel subtitleLabel = new JLabel("Grox Civilization Runtime");
        subtitleLabel.setForeground(TEXT_SECONDARY);
        subtitleLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JPanel titleBox = new JPanel();
        titleBox.setOpaque(false);
        titleBox.setLayout(new BoxLayout(titleBox, BoxLayout.Y_AXIS));
        titleBox.add(titleLabel);
        titleBox.add(subtitleLabel);

        header.add(titleBox, BorderLayout.WEST);

        statusLabel = new JLabel("Ready.");
        statusLabel.setForeground(ACCENT);
        statusLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        header.add(statusLabel, BorderLayout.EAST);

        mainArea.add(header, BorderLayout.NORTH);

        centerCards = new CardLayout();
        centerCardContainer = new JPanel(centerCards);
        centerCardContainer.setOpaque(false);
        centerCardContainer.setBorder(new EmptyBorder(10, 10, 10, 10));

        centerCardContainer.add(createHomePanel(), "home");
        centerCardContainer.add(createInstallationsPanel(), "inst");
        centerCardContainer.add(createSkinsPanel(), "skins");
        centerCardContainer.add(createPatchNotesPanel(), "patch");
        centerCardContainer.add(createAboutPanel(), "about");

        mainArea.add(centerCardContainer, BorderLayout.CENTER);

        JPanel bottomBar = new JPanel(new BorderLayout());
        bottomBar.setBackground(BG_MAIN);
        bottomBar.setBorder(new EmptyBorder(8, 20, 8, 20));
        bottomBar.setPreferredSize(new Dimension(100, 80));

        JPanel userPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        userPanel.setOpaque(false);

        JPanel avatar = new JPanel() {
            @Override protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                g.setColor(ACCENT_ALT);
                g.fillRoundRect(0, 0, getWidth(), getHeight(), 8, 8);
                g.setColor(new Color(0, 0, 0, 60));
                g.fillRoundRect(4, 4, getWidth() - 8, getHeight() - 8, 6, 6);
            }
        };
        avatar.setPreferredSize(new Dimension(40, 40));

        profileNameLabel = new JLabel(currentUsername);
        profileNameLabel.setForeground(TEXT_PRIMARY);
        profileNameLabel.setFont(new Font("SansSerif", Font.BOLD, 14));

        JLabel profileLabel = new JLabel("Microsoft Grox Profile (simulated)");
        profileLabel.setForeground(TEXT_SECONDARY);
        profileLabel.setFont(new Font("SansSerif", Font.PLAIN, 11));

        JPanel nameBox = new JPanel();
        nameBox.setOpaque(false);
        nameBox.setLayout(new BoxLayout(nameBox, BoxLayout.Y_AXIS));
        nameBox.add(profileNameLabel);
        nameBox.add(profileLabel);

        userPanel.add(avatar);
        userPanel.add(nameBox);

        bottomBar.add(userPanel, BorderLayout.WEST);

        JPanel centerBottom = new JPanel(new BorderLayout());
        centerBottom.setOpaque(false);

        progressBar = new JProgressBar(0, 100);
        progressBar.setVisible(false);
        progressBar.setStringPainted(true);
        progressBar.setForeground(ACCENT);
        progressBar.setBackground(new Color(40, 40, 40));

        centerBottom.add(progressBar, BorderLayout.CENTER);

        bottomBar.add(centerBottom, BorderLayout.CENTER);

        JButton playButton = new JButton("  PLAY  ") {
            @Override protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                Color base = getModel().isRollover() ? ACCENT_ALT : ACCENT;
                g2.setColor(base);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 30, 30);

                g2.setColor(new Color(0, 0, 0, 60));
                g2.drawRoundRect(1, 1, getWidth() - 3, getHeight() - 3, 28, 28);

                int cx = 18;
                int cy = getHeight() / 2;
                Polygon tri = new Polygon();
                tri.addPoint(cx - 4, cy - 7);
                tri.addPoint(cx - 4, cy + 7);
                tri.addPoint(cx + 6, cy);
                g2.setColor(Color.WHITE);
                g2.fillPolygon(tri);

                g2.dispose();
                super.paintComponent(g);
            }
        };
        playButton.setFont(new Font("SansSerif", Font.BOLD, 16));
        playButton.setForeground(Color.WHITE);
        playButton.setContentAreaFilled(false);
        playButton.setFocusPainted(false);
        playButton.setBorderPainted(false);
        playButton.setPreferredSize(new Dimension(150, 40));
        playButton.setHorizontalAlignment(SwingConstants.CENTER);
        playButton.addActionListener(e -> startLaunchThread());

        bottomBar.add(playButton, BorderLayout.EAST);

        mainArea.add(bottomBar, BorderLayout.SOUTH);

        homeSideButton.addActionListener(e -> switchSection("home", homeSideButton));
        instSideButton.addActionListener(e -> switchSection("inst", instSideButton));
        skinsSideButton.addActionListener(e -> switchSection("skins", skinsSideButton));
        patchSideButton.addActionListener(e -> switchSection("patch", patchSideButton));
        aboutSideButton.addActionListener(e -> switchSection("about", aboutSideButton));
    }

    private void applyLoadedState() {
        // Window size from settings
        // (already applied via setSize in loadSettings if present)

        // Active installation
        if (activeInstallation == null && installationModel.getSize() > 0) {
            activeInstallation = installationModel.getElementAt(0);
        }
        if (installationList != null && activeInstallation != null) {
            installationList.setSelectedValue(activeInstallation, true);
        }

        // Active skin
        if (activeSkin == null && skinModel.getSize() > 0) {
            activeSkin = skinModel.getElementAt(0);
        }
        if (skinList != null && activeSkin != null) {
            skinList.setSelectedValue(activeSkin, true);
            updateSkinPreview();
        }

        // Patch notes version
        if (patchVersionBox != null && lastPatchNotesVersion != null) {
            patchVersionBox.setSelectedItem(lastPatchNotesVersion);
        }

        // Last tab
        JButton target = homeSideButton;
        if ("inst".equals(lastTabKey)) target = instSideButton;
        else if ("skins".equals(lastTabKey)) target = skinsSideButton;
        else if ("patch".equals(lastTabKey)) target = patchSideButton;
        else if ("about".equals(lastTabKey)) target = aboutSideButton;
        switchSection(lastTabKey, target);
    }

    private JButton createSidebarButton(String text, boolean active) {
        JButton b = new JButton(text);
        b.setFocusPainted(false);
        b.setContentAreaFilled(false);
        b.setBorderPainted(false);
        b.setHorizontalAlignment(SwingConstants.LEFT);
        b.setBorder(new EmptyBorder(6, 14, 6, 14));
        b.setFont(new Font("SansSerif", active ? Font.BOLD : Font.PLAIN, 13));
        b.setForeground(active ? TEXT_PRIMARY : TEXT_SECONDARY);
        if (active) {
            b.setOpaque(true);
            b.setBackground(new Color(50, 50, 50));
        } else {
            b.setOpaque(false);
        }
        return b;
    }

    private void switchSection(String key, JButton activeButton) {
        lastTabKey = key;
        centerCards.show(centerCardContainer, key);

        JButton[] all = {homeSideButton, instSideButton, skinsSideButton, patchSideButton, aboutSideButton};
        for (JButton b : all) {
            if (b == activeButton) {
                b.setForeground(TEXT_PRIMARY);
                b.setFont(new Font("SansSerif", Font.BOLD, 13));
                b.setOpaque(true);
                b.setBackground(new Color(50, 50, 50));
            } else {
                b.setForeground(TEXT_SECONDARY);
                b.setFont(new Font("SansSerif", Font.PLAIN, 13));
                b.setOpaque(false);
            }
        }
        saveSettings();
    }

    // --- Home Panel ---
    private JPanel createHomePanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel();
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(20, 20, 20, 20));
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));

        JLabel title = new JLabel("THE GROX UPDATE");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 18));

        JLabel subtitle = new JLabel("New official launcher handles all files for you.");
        subtitle.setForeground(TEXT_SECONDARY);
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 13));

        JTextArea body = new JTextArea(
            "• Auto-downloads IRL Simulator files\n" +
            "• Injects Grox profile and Revenge skin\n" +
            "• Multiplayer presets ready to copy\n\n" +
            "Active installation and skin are used when you press PLAY at the bottom."
        );
        body.setEditable(false);
        body.setOpaque(false);
        body.setForeground(TEXT_SECONDARY);
        body.setFont(new Font("SansSerif", Font.PLAIN, 13));
        body.setLineWrap(true);
        body.setWrapStyleWord(true);

        card.add(title);
        card.add(Box.createVerticalStrut(4));
        card.add(subtitle);
        card.add(Box.createVerticalStrut(12));
        card.add(body);

        panel.add(card, BorderLayout.CENTER);
        return panel;
    }

    // --- Installations Panel ---
    private JPanel createInstallationsPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(16, 16, 16, 16));

        JLabel title = new JLabel("INSTALLATIONS");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));
        card.add(title, BorderLayout.NORTH);

        if (installationModel.isEmpty()) {
            installationModel.addElement(new Installation("IRL Simulator - Default", "1.0.0", JAR_NAME));
        }

        installationList = new JList<>(installationModel);
        installationList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        installationList.setBackground(new Color(20, 20, 20));
        installationList.setForeground(TEXT_PRIMARY);
        installationList.setFont(new Font("SansSerif", Font.PLAIN, 12));
        installationList.setBorder(new EmptyBorder(4, 4, 4, 4));
        installationList.setSelectedIndex(0);

        card.add(new JScrollPane(installationList), BorderLayout.CENTER);

        JPanel bottom = new JPanel(new BorderLayout());
        bottom.setOpaque(false);
        bottom.setBorder(new EmptyBorder(8, 0, 0, 0));

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        buttons.setOpaque(false);

        JButton addBtn = new JButton("New");
        JButton editBtn = new JButton("Edit");
        JButton delBtn = new JButton("Delete");
        JButton setActiveBtn = new JButton("Set Active");

        for (JButton b : new JButton[]{addBtn, editBtn, delBtn, setActiveBtn}) {
            b.setFocusPainted(false);
            b.setFont(new Font("SansSerif", Font.PLAIN, 11));
        }

        addBtn.addActionListener(e -> { addInstallation(); saveInstallations(); });
        editBtn.addActionListener(e -> { editInstallation(); saveInstallations(); });
        delBtn.addActionListener(e -> { deleteInstallation(); saveInstallations(); });
        setActiveBtn.addActionListener(e -> { setActiveInstallation(); saveSettings(); });

        buttons.add(addBtn);
        buttons.add(editBtn);
        buttons.add(delBtn);
        buttons.add(setActiveBtn);

        JPanel msPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 6, 0));
        msPanel.setOpaque(false);

        JButton msSignInButton = new JButton("Sign in with Microsoft");
        msSignInButton.setFocusPainted(false);
        msSignInButton.setBackground(new Color(0, 120, 215));
        msSignInButton.setForeground(Color.WHITE);
        msSignInButton.setFont(new Font("SansSerif", Font.BOLD, 11));
        msSignInButton.setBorder(BorderFactory.createEmptyBorder(6, 10, 6, 10));
        msSignInButton.addActionListener(e -> { simulateMicrosoftSignIn(); saveProfile(); });

        msPanel.add(msSignInButton);

        bottom.add(buttons, BorderLayout.WEST);
        bottom.add(msPanel, BorderLayout.EAST);

        card.add(bottom, BorderLayout.SOUTH);

        panel.add(card, BorderLayout.CENTER);
        return panel;
    }

    private void addInstallation() {
        JTextField nameField = new JTextField("New Installation");
        JTextField versionField = new JTextField("1.0.0");
        JTextField pathField = new JTextField(JAR_NAME);

        JPanel p = new JPanel(new GridLayout(0, 1, 4, 4));
        p.add(new JLabel("Name:"));
        p.add(nameField);
        p.add(new JLabel("Version:"));
        p.add(versionField);
        p.add(new JLabel("Jar Path:"));
        p.add(pathField);

        int res = JOptionPane.showConfirmDialog(this, p, "Create Installation",
                                                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (res == JOptionPane.OK_OPTION) {
            Installation inst = new Installation(nameField.getText().trim(),
                                                 versionField.getText().trim(),
                                                 pathField.getText().trim());
            installationModel.addElement(inst);
        }
    }

    private void editInstallation() {
        Installation inst = installationList.getSelectedValue();
        if (inst == null) return;

        JTextField nameField = new JTextField(inst.name);
        JTextField versionField = new JTextField(inst.version);
        JTextField pathField = new JTextField(inst.path);

        JPanel p = new JPanel(new GridLayout(0, 1, 4, 4));
        p.add(new JLabel("Name:"));
        p.add(nameField);
        p.add(new JLabel("Version:"));
        p.add(versionField);
        p.add(new JLabel("Jar Path:"));
        p.add(pathField);

        int res = JOptionPane.showConfirmDialog(this, p, "Edit Installation",
                                                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (res == JOptionPane.OK_OPTION) {
            inst.name = nameField.getText().trim();
            inst.version = versionField.getText().trim();
            inst.path = pathField.getText().trim();
            installationList.repaint();
        }
    }

    private void deleteInstallation() {
        Installation inst = installationList.getSelectedValue();
        if (inst == null) return;
        int res = JOptionPane.showConfirmDialog(this,
                "Delete installation \"" + inst.name + "\"?",
                "Delete Installation", JOptionPane.YES_NO_OPTION);
        if (res == JOptionPane.YES_OPTION) {
            installationModel.removeElement(inst);
            if (inst == activeInstallation) {
                activeInstallation = null;
                setStatus("Active installation removed. Set a new one.");
            }
        }
    }

    private void setActiveInstallation() {
        Installation inst = installationList.getSelectedValue();
        if (inst == null) return;
        activeInstallation = inst;
        setStatus("Active installation set to: " + inst.name);
    }

    // --- Skins Panel ---
    private JPanel createSkinsPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(16, 16, 16, 16));

        JLabel title = new JLabel("SKINS");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));
        card.add(title, BorderLayout.NORTH);

        if (skinModel.isEmpty()) {
            skinModel.addElement(new SkinEntry("Revenge Purple Block (default)", null));
        }

        skinList = new JList<>(skinModel);
        skinList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        skinList.setBackground(new Color(20, 20, 20));
        skinList.setForeground(TEXT_PRIMARY);
        skinList.setFont(new Font("SansSerif", Font.PLAIN, 12));
        skinList.setBorder(new EmptyBorder(4, 4, 4, 4));
        skinList.setSelectedIndex(0);

        JPanel left = new JPanel(new BorderLayout());
        left.setOpaque(false);
        left.add(new JScrollPane(skinList), BorderLayout.CENTER);

        JPanel leftButtons = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 4));
        leftButtons.setOpaque(false);
        JButton addSkinBtn = new JButton("Add PNG");
        JButton setActiveSkinBtn = new JButton("Set Active");
        JButton removeSkinBtn = new JButton("Remove");

        for (JButton b : new JButton[]{addSkinBtn, setActiveSkinBtn, removeSkinBtn}) {
            b.setFocusPainted(false);
            b.setFont(new Font("SansSerif", Font.PLAIN, 11));
        }

        addSkinBtn.addActionListener(e -> { addSkin(); saveSkins(); });
        setActiveSkinBtn.addActionListener(e -> { setActiveSkin(); saveSettings(); });
        removeSkinBtn.addActionListener(e -> { removeSkin(); saveSkins(); saveSettings(); });

        leftButtons.add(addSkinBtn);
        leftButtons.add(setActiveSkinBtn);
        leftButtons.add(removeSkinBtn);
        left.add(leftButtons, BorderLayout.SOUTH);

        card.add(left, BorderLayout.WEST);

        JPanel right = new JPanel(new BorderLayout());
        right.setOpaque(false);
        right.setBorder(new EmptyBorder(0, 16, 0, 0));

        skinPreviewLabel = new JLabel("Skin Preview", SwingConstants.CENTER);
        skinPreviewLabel.setForeground(TEXT_SECONDARY);
        skinPreviewLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        skinPreviewLabel.setPreferredSize(new Dimension(220, 220));
        skinPreviewLabel.setBorder(BorderFactory.createLineBorder(new Color(60, 60, 60)));

        right.add(skinPreviewLabel, BorderLayout.CENTER);

        JLabel hint = new JLabel("Active skin will be applied when launching.");
        hint.setForeground(TEXT_SECONDARY);
        hint.setFont(new Font("SansSerif", Font.PLAIN, 11));
        right.add(hint, BorderLayout.SOUTH);

        card.add(right, BorderLayout.CENTER);

        panel.add(card, BorderLayout.CENTER);
        return panel;
    }

    private void addSkin() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Select Skin PNG");
        int res = chooser.showOpenDialog(this);
        if (res == JFileChooser.APPROVE_OPTION) {
            File f = chooser.getSelectedFile();
            skinModel.addElement(new SkinEntry(f.getName(), f.getAbsolutePath()));
        }
    }

    private void setActiveSkin() {
        SkinEntry entry = skinList.getSelectedValue();
        if (entry == null) return;
        activeSkin = entry;
        setStatus("Active skin set to: " + entry.name);
        updateSkinPreview();
    }

    private void removeSkin() {
        SkinEntry entry = skinList.getSelectedValue();
        if (entry == null) return;
        if (entry.path == null) {
            JOptionPane.showMessageDialog(this, "Cannot remove default skin.", "Skins",
                                          JOptionPane.INFORMATION_MESSAGE);
            return;
        }
        skinModel.removeElement(entry);
        if (entry == activeSkin) {
            activeSkin = null;
            skinPreviewLabel.setIcon(null);
            skinPreviewLabel.setText("Skin Preview");
        }
    }

    private void updateSkinPreview() {
        if (activeSkin == null || activeSkin.path == null) {
            skinPreviewLabel.setIcon(null);
            skinPreviewLabel.setText("Skin Preview (default purple block)");
            return;
        }
        try {
            BufferedImage img = ImageIO.read(new File(activeSkin.path));
            if (img != null) {
                Image scaled = img.getScaledInstance(220, 220, Image.SCALE_SMOOTH);
                skinPreviewLabel.setIcon(new ImageIcon(scaled));
                skinPreviewLabel.setText("");
            }
        } catch (IOException e) {
            skinPreviewLabel.setIcon(null);
            skinPreviewLabel.setText("Failed to load skin preview.");
        }
    }

    // --- Patch Notes Panel ---
    private JPanel createPatchNotesPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(16, 16, 16, 16));

        JLabel title = new JLabel("PATCH NOTES");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));
        card.add(title, BorderLayout.NORTH);

        patchNotesArea = new JTextArea();
        patchNotesArea.setEditable(false);
        patchNotesArea.setLineWrap(true);
        patchNotesArea.setWrapStyleWord(true);
        patchNotesArea.setForeground(TEXT_SECONDARY);
        patchNotesArea.setBackground(new Color(20, 20, 20));
        patchNotesArea.setFont(new Font("SansSerif", Font.PLAIN, 12));
        patchNotesArea.setBorder(new EmptyBorder(8, 8, 8, 8));

        patchVersionBox = new JComboBox<>(new String[]{
            "IRL Simulator 1.1.0 - The Grox Update",
            "IRL Simulator 1.0.0 - Initial Release"
        });

        patchVersionBox.addActionListener(e -> {
            String sel = (String) patchVersionBox.getSelectedItem();
            if (sel != null && sel.startsWith("IRL Simulator 1.1.0")) {
                patchNotesArea.setText(
                    "IRL Simulator 1.1.0 - The Grox Update\n\n" +
                    "- Added official Grox Launcher integration.\n" +
                    "- Auto-downloads core files from the Grox CDN.\n" +
                    "- Added Revenge Purple default skin.\n" +
                    "- Improved multiplayer server presets.\n" +
                    "- Various stability and civilization tweaks."
                );
            } else {
                patchNotesArea.setText(
                    "IRL Simulator 1.0.0 - Initial Release\n\n" +
                    "- First public build of IRL Simulator.\n" +
                    "- Core world simulation.\n" +
                    "- Basic multiplayer support.\n" +
                    "- Default player profile: Grox."
                );
            }
            lastPatchNotesVersion = sel;
            saveSettings();
        });

        patchVersionBox.setSelectedItem(lastPatchNotesVersion);

        card.add(patchVersionBox, BorderLayout.SOUTH);
        card.add(new JScrollPane(patchNotesArea), BorderLayout.CENTER);

        panel.add(card, BorderLayout.CENTER);
        return panel;
    }

    // --- About Panel ---
    private JPanel createAboutPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel();
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(16, 16, 16, 16));
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));

        JLabel title = new JLabel("ABOUT IRL SIMULATOR LAUNCHER");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));

        JLabel build = new JLabel("Build: " + BUILD_ID);
        build.setForeground(TEXT_SECONDARY);
        build.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JLabel javaVer = new JLabel("Java: " + System.getProperty("java.version"));
        javaVer.setForeground(TEXT_SECONDARY);
        javaVer.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JLabel os = new JLabel("OS: " + System.getProperty("os.name") + " " + System.getProperty("os.version"));
        os.setForeground(TEXT_SECONDARY);
        os.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JTextArea lore = new JTextArea(
            "Grox Civilization Runtime\n\n" +
            "This launcher is a custom, Grox-themed front-end for IRL Simulator.\n" +
            "It manages installations, skins, patch notes, and profile identity.\n\n" +
            "Designed to feel familiar to Minecraft players, but with its own\n" +
            "visual identity and Grox lore baked in."
        );
        lore.setEditable(false);
        lore.setOpaque(false);
        lore.setForeground(TEXT_SECONDARY);
        lore.setFont(new Font("SansSerif", Font.PLAIN, 12));
        lore.setLineWrap(true);
        lore.setWrapStyleWord(true);

        card.add(title);
        card.add(Box.createVerticalStrut(8));
        card.add(build);
        card.add(javaVer);
        card.add(os);
        card.add(Box.createVerticalStrut(12));
        card.add(lore);

        panel.add(card, BorderLayout.CENTER);
        return panel;
    }

    // --- Microsoft Sign-In (Simulated) ---
    private void simulateMicrosoftSignIn() {
        String name = JOptionPane.showInputDialog(
            this,
            "Enter your Microsoft gamertag / name:",
            "Sign in with Microsoft (Simulated)",
            JOptionPane.PLAIN_MESSAGE
        );
        if (name != null && !name.trim().isEmpty()) {
            currentUsername = name.trim();
            isSignedInWithMicrosoft = true;
            SwingUtilities.invokeLater(() -> {
                profileNameLabel.setText(currentUsername);
                profileTagLabel.setText("PROFILE: " + currentUsername.toUpperCase());
                statusLabel.setText("Signed in as " + currentUsername + " (simulated).");
            });
        }
    }

    // --- Launch Flow ---
    private void startLaunchThread() {
        Thread t = new Thread(() -> {
            try {
                if (activeInstallation == null) {
                    setStatus("No active installation. Set one in Installations.");
                    JOptionPane.showMessageDialog(this,
                            "No active installation selected.\nSet one in the Installations tab.",
                            "Launch Error", JOptionPane.ERROR_MESSAGE);
                    return;
                }
                setStatus("Checking installation: " + activeInstallation.name);
                File jar = new File(activeInstallation.path);
                if (!jar.exists()) {
                    downloadAndExtract();
                }
                launchGame();
            } catch (Exception ex) {
                ex.printStackTrace();
                setStatus("Error: " + ex.getMessage());
                SwingUtilities.invokeLater(() ->
                    JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage(),
                                                  "Launch Error", JOptionPane.ERROR_MESSAGE)
                );
            }
        });
        t.setDaemon(true);
        t.start();
    }

    private void downloadAndExtract() throws IOException {
        SwingUtilities.invokeLater(() -> {
            progressBar.setVisible(true);
            progressBar.setValue(0);
            progressBar.setString("Downloading irl.zip...");
        });

        Path zipPath = Paths.get("irl_temp.zip");

        try (InputStream in = new URL(DOWNLOAD_URL).openStream()) {
            Files.copy(in, zipPath, StandardCopyOption.REPLACE_EXISTING);
        }

        SwingUtilities.invokeLater(() -> {
            progressBar.setValue(40);
            progressBar.setString("Extracting files...");
        });

        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipPath.toFile()))) {
            ZipEntry entry;
            byte[] buffer = new byte[8192];
            while ((entry = zis.getNextEntry()) != null) {
                File outFile = new File(entry.getName());
                if (entry.isDirectory()) {
                    outFile.mkdirs();
                } else {
                    File parent = outFile.getParentFile();
                    if (parent != null) parent.mkdirs();
                    try (FileOutputStream fos = new FileOutputStream(outFile)) {
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }
                }
            }
        }

        Files.deleteIfExists(zipPath);

        SwingUtilities.invokeLater(() -> {
            progressBar.setValue(100);
            progressBar.setString("Installation complete.");
        });
        setStatus("Installation complete.");
    }

private void launchGame() throws IOException {
    setStatus("Preparing profile and skin...");

    File skinDir = new File("skins");
    skinDir.mkdirs();

    File targetSkin = new File(skinDir, "default.png");

    if (activeSkin != null && activeSkin.path != null) {
        Files.copy(Paths.get(activeSkin.path), targetSkin.toPath(), StandardCopyOption.REPLACE_EXISTING);
    } else {
        BufferedImage skin = new BufferedImage(64, 64, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = skin.createGraphics();
        g.setColor(new Color(128, 0, 128));
        g.fillRect(0, 0, 64, 64);
        g.dispose();
        ImageIO.write(skin, "png", targetSkin);
    }

    setStatus("Launching IRL Simulator...");

    String javaExec = System.getProperty("java.home") + File.separator + "bin" + File.separator + "java";

    List<String> cmd = new ArrayList<>();
    cmd.add(javaExec);
    cmd.add("-cp");
    cmd.add(activeInstallation.path);
    cmd.add("main.Main");

    cmd.add("--PathToClasses");
    cmd.add(".");

    cmd.add("--Name");
    cmd.add(currentUsername);

    cmd.add("--skinDir");
    cmd.add("skins");

    // ⭐ NEW REQUIRED ARGUMENT
    cmd.add("--version");
    cmd.add(activeInstallation.version);

    ProcessBuilder pb = new ProcessBuilder(cmd);
    pb.directory(new File("."));
    pb.inheritIO();
    pb.start();

    SwingUtilities.invokeLater(() -> {
        progressBar.setVisible(false);
        setStatus("Game launched. You can close the launcher.");
    });
}

    private void setStatus(String text) {
        SwingUtilities.invokeLater(() -> statusLabel.setText(text));
    }

    // --- Persistence ---
    private void loadProfile() {
        File f = new File(DATA_DIR, PROFILE_FILE);
        if (!f.exists()) return;
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = br.readLine()) != null) {
                int idx = line.indexOf('=');
                if (idx <= 0) continue;
                String key = line.substring(0, idx);
                String val = line.substring(idx + 1);
                if ("username".equals(key)) currentUsername = val;
                else if ("signedIn".equals(key)) isSignedInWithMicrosoft = Boolean.parseBoolean(val);
            }
        } catch (IOException ignored) {}
    }

    private void saveProfile() {
        File f = new File(DATA_DIR, PROFILE_FILE);
        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            pw.println("username=" + currentUsername);
            pw.println("signedIn=" + isSignedInWithMicrosoft);
        } catch (IOException ignored) {}
    }

    private void loadInstallations() {
        File f = new File(DATA_DIR, INSTALLATIONS_FILE);
        if (!f.exists()) return;
        installationModel.clear();
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|", 3);
                if (parts.length == 3) {
                    installationModel.addElement(new Installation(parts[0], parts[1], parts[2]));
                }
            }
        } catch (IOException ignored) {}
    }

    private void saveInstallations() {
        File f = new File(DATA_DIR, INSTALLATIONS_FILE);
        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            for (int i = 0; i < installationModel.size(); i++) {
                Installation inst = installationModel.get(i);
                pw.println(inst.name + "|" + inst.version + "|" + inst.path);
            }
        } catch (IOException ignored) {}
    }

    private void loadSkins() {
        File f = new File(DATA_DIR, SKINS_FILE);
        if (!f.exists()) return;
        skinModel.clear();
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|", 2);
                if (parts.length == 2) {
                    String name = parts[0];
                    String path = parts[1].isEmpty() ? null : parts[1];
                    skinModel.addElement(new SkinEntry(name, path));
                }
            }
        } catch (IOException ignored) {}
    }

    private void saveSkins() {
        File f = new File(DATA_DIR, SKINS_FILE);
        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            for (int i = 0; i < skinModel.size(); i++) {
                SkinEntry se = skinModel.get(i);
                String path = se.path == null ? "" : se.path;
                pw.println(se.name + "|" + path);
            }
        } catch (IOException ignored) {}
    }

    private void loadSettings() {
        File f = new File(DATA_DIR, SETTINGS_FILE);
        if (!f.exists()) return;
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            Integer w = null, h = null;
            String activeInstName = null;
            String activeSkinName = null;
            while ((line = br.readLine()) != null) {
                int idx = line.indexOf('=');
                if (idx <= 0) continue;
                String key = line.substring(0, idx);
                String val = line.substring(idx + 1);
                switch (key) {
                    case "lastTab" -> lastTabKey = val;
                    case "width" -> w = parseIntSafe(val);
                    case "height" -> h = parseIntSafe(val);
                    case "patchVersion" -> lastPatchNotesVersion = val;
                    case "activeInstallation" -> activeInstName = val;
                    case "activeSkin" -> activeSkinName = val;
                }
            }
            if (w != null && h != null) {
                setSize(w, h);
            }
            if (activeInstName != null) {
                for (int i = 0; i < installationModel.size(); i++) {
                    Installation inst = installationModel.get(i);
                    if (inst.name.equals(activeInstName)) {
                        activeInstallation = inst;
                        break;
                    }
                }
            }
            if (activeSkinName != null) {
                for (int i = 0; i < skinModel.size(); i++) {
                    SkinEntry se = skinModel.get(i);
                    if (se.name.equals(activeSkinName)) {
                        activeSkin = se;
                        break;
                    }
                }
            }
        } catch (IOException ignored) {}
    }

    private void saveSettings() {
        File f = new File(DATA_DIR, SETTINGS_FILE);
        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            pw.println("lastTab=" + lastTabKey);
            pw.println("width=" + getWidth());
            pw.println("height=" + getHeight());
            pw.println("patchVersion=" + (lastPatchNotesVersion == null ? "" : lastPatchNotesVersion));
            pw.println("activeInstallation=" + (activeInstallation == null ? "" : activeInstallation.name));
            pw.println("activeSkin=" + (activeSkin == null ? "" : activeSkin.name));
        } catch (IOException ignored) {}
    }

    private Integer parseIntSafe(String s) {
        try { return Integer.parseInt(s); } catch (NumberFormatException e) { return null; }
    }

    // --- Helpers / Inner Classes ---
    private static class DottedBackgroundPanel extends JPanel {
        @Override protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setColor(BG_MAIN);
            g2.fillRect(0, 0, getWidth(), getHeight());
            g2.setColor(new Color(255, 255, 255, 12));
            for (int y = 0; y < getHeight(); y += 8) {
                for (int x = 0; x < getWidth(); x += 8) {
                    g2.fillRect(x, y, 1, 1);
                }
            }
            g2.dispose();
        }
    }

    private static class Installation {
        String name;
        String version;
        String path;

        Installation(String name, String version, String path) {
            this.name = name;
            this.version = version;
            this.path = path;
        }

        @Override public String toString() {
            return name + "  [" + version + "]";
        }
    }

    private static class SkinEntry {
        String name;
        String path; // null = default

        SkinEntry(String name, String path) {
            this.name = name;
            this.path = path;
        }

        @Override public String toString() {
            return name;
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            Launcher launcher = new Launcher();
            launcher.setVisible(true);
        });
    }
}
